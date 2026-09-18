from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt

from ..schemas.approval import ApprovalState
from ..tools.hr_tools import create_hr_request
from ..tools.it_tools import create_it_ticket
from ..tools.facilities_tools import create_maintenance_ticket


def approval_node(state: ApprovalState):
    decision = interrupt(
        {
            "type": "approval_request",
            "action": state["action"],
            "employee_id": state["employee_id"],
            "department": state["department"],
            "description": state["description"],
        }
    )

    return {
        "approved": decision == "approved"
    }


def execute_action_node(state: ApprovalState):
    department = state["department"]
    action = state["action"]

    if department == "hr":
        result = create_hr_request.invoke(
            {
                "employee_id": state["employee_id"],
                "request_type": action,
                "description": state["description"],
            }
        )

    elif department == "it":
        result = create_it_ticket.invoke(
            {
                "employee_id": state["employee_id"],
                "issue": state["description"],
            }
        )

    elif department == "facilities":
        result = create_maintenance_ticket.invoke(
            {
                "employee_id": state["employee_id"],
                "issue": state["description"],
            }
        )

    else:
        result = {
            "success": False,
            "message": "Unsupported department",
        }

    return {
        "action_result": result
    }


def route_after_approval(state: ApprovalState):
    if state.get("approved"):
        return "execute_action"

    return END


def build_approval_graph(checkpointer):
    builder = StateGraph(ApprovalState)

    builder.add_node("approval", approval_node)
    builder.add_node("execute_action", execute_action_node)

    builder.add_edge(START, "approval")

    builder.add_conditional_edges(
        "approval",
        route_after_approval,
        {
            "execute_action": "execute_action",
            END: END,
        },
    )

    builder.add_edge("execute_action", END)

    return builder.compile(
        checkpointer=checkpointer
    )