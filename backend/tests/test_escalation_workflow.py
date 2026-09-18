import pytest

from ai.agents.escalation_workflow import build_escalation_graph
from ai.memory.checkpointer import create_checkpointer


@pytest.mark.asyncio
async def test_escalation_pauses_for_human():
    async with create_checkpointer() as checkpointer:
        graph = build_escalation_graph(checkpointer)

        config = {
            "configurable": {
                "thread_id": "test-escalation-001"
            }
        }

        result = await graph.ainvoke(
            {
                "employee_id": "EMP001",
                "department": "hr",
                "description": "I need help with an unclear HR request.",
                "escalation_reason": "Low confidence",
            },
            config=config,
        )

        assert "__interrupt__" in result