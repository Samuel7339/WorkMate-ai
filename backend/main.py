import json
import re

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


class ApprovalRequest(BaseModel):
    thread_id: str
    decision: str


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


@app.get("/approval-status/{thread_id}")
async def get_approval_status(thread_id: str):
    result = approval_results.get(thread_id)

    if not result:
        return {
            "status": "pending"
        }

    return result


@app.post("/chat")
async def chat(request: ChatRequest):

    create_conversation(
        request.thread_id,
        request.message[:50],
    )

    save_message(
        request.thread_id,
        "user",
        request.message,
    )

    async with create_checkpointer() as checkpointer:

        supervisor = create_supervisor(
            checkpointer
        )

        result = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": request.message,
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": request.thread_id,
                }
            },
        )

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

        if specialist_response:

            action = route_action(
                specialist_response.response
            )

            if action == "approval":

                employee_match = re.search(
                    r"\bEMP\d+\b",
                    request.message.upper(),
                )

                employee_id = (
                    employee_match.group(0)
                    if employee_match
                    else ""
                )

                approval_graph = build_approval_graph(
                    checkpointer
                )

                approval_result = (
                    await approval_graph.ainvoke(
                        {
                            "employee_id": employee_id,
                            "department": (
                                specialist_response.response.department
                            ),
                            "action": (
                                specialist_response.response.intent
                            ),
                            "description": request.message,
                        },
                        config={
                            "configurable": {
                                "thread_id": request.thread_id,
                            }
                        },
                    )
                )

                interrupts = approval_result.get(
                    "__interrupt__",
                    []
                )

                if interrupts:

                    approval_data = {
                        "thread_id": request.thread_id,
                        **interrupts[0].value,
                    }

                    pending_approvals[
                        request.thread_id
                    ] = approval_data

                    save_message(
                        request.thread_id,
                        "assistant",
                        "⚠️ Your request requires approval. "
                        "It has been sent to an authorized reviewer.",
                    )

                    return {
                        "thread_id": request.thread_id,
                        "type": "approval_required",
                        "approval": approval_data,
                    }

        answer = result["messages"][-1].text

        save_message(
            request.thread_id,
            "assistant",
            answer,
        )

        return {
            "thread_id": request.thread_id,
            "type": "message",
            "answer": answer,
        }


@app.post("/approval")
async def approval(request: ApprovalRequest):

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

        approval_results[
            request.thread_id
        ] = {
            "status": request.decision,
            "result": action_result,
        }

        pending_approvals.pop(
            request.thread_id,
            None,
        )

        return {
            "thread_id": request.thread_id,
            "decision": request.decision,
            "result": action_result,
        }