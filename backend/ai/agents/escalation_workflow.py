from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt

from ..schemas.approval import ApprovalState


def escalation_node(state: ApprovalState):
    interrupt(
        {
            "type": "human_escalation",
            "employee_id": state["employee_id"],
            "department": state["department"],
            "reason": state["escalation_reason"],
            "description": state["description"],
        }
    )

    return {
        "requires_human": True
    }


def build_escalation_graph(checkpointer):
    builder = StateGraph(ApprovalState)

    builder.add_node("escalation", escalation_node)

    builder.add_edge(START, "escalation")
    builder.add_edge("escalation", END)

    return builder.compile(
        checkpointer=checkpointer
    )