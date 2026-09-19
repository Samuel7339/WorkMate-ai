
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain.messages import ToolMessage
from langgraph.types import Command
from pydantic import BaseModel

from ai.agents.supervisor import create_supervisor
from ai.agents.action_router import route_action
from ai.agents.approval_workflow import build_approval_graph
from ai.memory.checkpointer import create_checkpointer
from ai.schemas.specialist_response import SpecialistResponse

from database import (
    create_conversation,
    save_message,
    get_chat_history,
    get_conversations,
    create_approval,
    get_pending_approval,
    get_approval_history,
    update_approval,
    get_connection,
    delete_conversation,
)


app = FastAPI(
    title="WorkMate AI",
    description="Employee Helpdesk & Operations Agent",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


pending_approvals = {}
approval_results = {}


class ChatRequest(BaseModel):
    message: str
    thread_id: str

    # Temporary demo identity.
    # The frontend will provide the real employee ID later.
    employee_id: str = "EMP001"


class ApprovalRequest(BaseModel):
    thread_id: str
    decision: str
    employee_id: str = "EMP001"


@app.get("/")
async def root():
    return {
        "message": "WorkMate AI is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }


@app.get("/conversations")
async def conversations():
    return get_conversations()


@app.get("/chat-history/{thread_id}")
async def chat_history(thread_id: str):
    return get_chat_history(thread_id)


@app.get("/approvals")
async def get_approvals():
    return list(pending_approvals.values())


@app.get("/approval-history")
async def approval_history():
    connection = get_connection()

    approvals = connection.execute(
        """
        SELECT *
        FROM approvals
        ORDER BY approval_id DESC
        """
    ).fetchall()

    connection.close()

    return [dict(approval) for approval in approvals]


@app.get("/approval-status/{thread_id}")
async def get_approval_status(thread_id: str):
    result = approval_results.get(thread_id)

    if result:
        return result

    approval = get_pending_approval(thread_id)

    if approval:
        return {
            "status": "pending",
            "approval": approval,
        }

    history = get_approval_history(thread_id)

    if history:
        latest = history[0]

        return {
            "status": latest["status"],
            "approval": latest,
        }

    return {
        "status": "not_found",
    }


@app.post("/chat")
async def chat(request: ChatRequest):

    # --------------------------------------------------
    # Validate employee
    # --------------------------------------------------

    connection = get_connection()

    employee = connection.execute(
        """
        SELECT employee_id
        FROM employees
        WHERE employee_id = ?
        """,
        (request.employee_id,),
    ).fetchone()

    connection.close()

    if not employee:
        return {
            "success": False,
            "message": "Employee not found",
        }

    # --------------------------------------------------
    # Save conversation
    # --------------------------------------------------

    create_conversation(
        request.thread_id,
        request.message[:50],
    )

    save_message(
        request.thread_id,
        "user",
        request.message,
    )

    # --------------------------------------------------
    # Run supervisor
    # --------------------------------------------------

    async with create_checkpointer() as checkpointer:

        supervisor = create_supervisor(checkpointer)

        result = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Current employee ID: {request.employee_id}\n\n"
                            f"Employee request: {request.message}"
                        ),
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": request.thread_id
                }
            },
        )

        # --------------------------------------------------
        # Find specialist response
        # --------------------------------------------------

        specialist_response = None

        for message in result["messages"]:

            if isinstance(message, ToolMessage):

                try:
                    specialist_response = (
                        SpecialistResponse.model_validate(
                            json.loads(message.content)
                        )
                    )

                except (
                    json.JSONDecodeError,
                    TypeError,
                    ValueError,
                ):
                    continue

        # --------------------------------------------------
        # Handle action / approval
        # --------------------------------------------------

        if specialist_response:

            action = route_action(
                specialist_response.response
            )

            if action == "approval":

                # Employee identity comes from the request,
                # NOT from the user's message.
                employee_id = request.employee_id

                approval_graph = build_approval_graph(
                    checkpointer
                )

                approval_result = (
                    await approval_graph.ainvoke(
                        {
                            "employee_id": employee_id,
                            "department": (
                                specialist_response
                                .response
                                .department
                            ),
                            "action": (
                                specialist_response
                                .response
                                .intent
                            ),
                            "description": request.message,
                        },
                        config={
                            "configurable": {
                                "thread_id": request.thread_id
                            }
                        },
                    )
                )

                interrupts = approval_result.get(
                    "__interrupt__",
                    [],
                )

                if interrupts:

                    approval_data = {
                        "thread_id": request.thread_id,
                        **interrupts[0].value,
                    }

                    # --------------------------------------------------
                    # Persist approval
                    # --------------------------------------------------

                    create_approval(
                        thread_id=request.thread_id,
                        employee_id=approval_data[
                            "employee_id"
                        ],
                        department=approval_data[
                            "department"
                        ],
                        action=approval_data[
                            "action"
                        ],
                        description=approval_data[
                            "description"
                        ],
                    )

                    # Keep in memory for current UI session.
                    pending_approvals[
                        request.thread_id
                    ] = approval_data

                    save_message(
                        request.thread_id,
                        "assistant",
                        (
                            "⚠️ Your request requires approval. "
                            "It has been sent to an authorized "
                            "reviewer."
                        ),
                    )

                    return {
                        "thread_id": request.thread_id,
                        "type": "approval_required",
                        "approval": approval_data,
                    }

        # --------------------------------------------------
        # Normal response
        # --------------------------------------------------

        answer = result["messages"][-1].text

        sources = []

        if specialist_response:
            sources = specialist_response.sources

        save_message(
            request.thread_id,
            "assistant",
            answer,
        )

        return {
            "thread_id": request.thread_id,
            "type": "message",
            "answer": answer,
            "sources": sources,
        }


@app.post("/approval")
async def approval(request: ApprovalRequest):

    # Validate decision

    if request.decision not in [
        "approved",
        "rejected",
    ]:
        return {
            "success": False,
            "message": (
                "Decision must be approved or rejected"
            ),
        }

    # Find persistent pending approval

    approval = get_pending_approval(
        request.thread_id
    )

    if not approval:

        return {
            "success": False,
            "message": "No pending approval found",
        }

    # Verify that the approval belongs to the
    # employee making the request.

    if approval["employee_id"] != request.employee_id:

        return {
            "success": False,
            "message": "Approval authorization failed",
        }

    # Resume approval workflow

    async with create_checkpointer() as checkpointer:

        approval_graph = build_approval_graph(
            checkpointer
        )

        result = await approval_graph.ainvoke(
            Command(
                resume=request.decision
            ),
            config={
                "configurable": {
                    "thread_id": request.thread_id
                }
            },
        )

        action_result = result.get(
            "action_result"
        )

        # Get created request/ticket ID

        request_id = None

        if (
            action_result
            and action_result.get("success")
        ):

            request_data = (
                action_result.get("request")
                or action_result.get("ticket")
            )

            if request_data:

                request_id = (
                    request_data.get("request_id")
                    or request_data.get("ticket_id")
                )

        # --------------------------------------------------
        # Persist approval result
        # --------------------------------------------------

        update_approval(
            thread_id=request.thread_id,
            status=request.decision,
            request_id=request_id,
        )

        # --------------------------------------------------
        # Create final chat message
        # --------------------------------------------------

        if request.decision == "approved":

            if (
                action_result
                and action_result.get("success")
            ):

                final_message = (
                    "✅ Request approved and created "
                    f"successfully. Request ID: {request_id}"
                )

            else:

                final_message = (
                    "⚠️ The request was approved, "
                    "but the action could not be completed."
                )

        else:

            final_message = (
                "❌ Your request was rejected "
                "by the reviewer."
            )

        save_message(
            request.thread_id,
            "assistant",
            final_message,
        )

        # --------------------------------------------------
        # Update current-session memory
        # --------------------------------------------------

        approval_results[
            request.thread_id
        ] = {
            "status": request.decision,
            "request_id": request_id,
            "result": action_result,
        }

        pending_approvals.pop(
            request.thread_id,
            None,
        )

        return {
            "thread_id": request.thread_id,
            "decision": request.decision,
            "request_id": request_id,
            "result": action_result,
        }


@app.delete("/conversations/{thread_id}")
async def delete_conversation_endpoint(thread_id: str):

    delete_conversation(thread_id)

    pending_approvals.pop(thread_id, None)
    approval_results.pop(thread_id, None)

    async with create_checkpointer() as checkpointer:

        await checkpointer.adelete_thread(thread_id)

        await checkpointer.adelete_thread(
            f"{thread_id}:hr"
        )

        await checkpointer.adelete_thread(
            f"{thread_id}:it"
        )

        await checkpointer.adelete_thread(
            f"{thread_id}:facilities"
        )

    return {
        "success": True,
        "message": "Conversation deleted",
        "thread_id": thread_id,
    }

