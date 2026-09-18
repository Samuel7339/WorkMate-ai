import pytest
from langgraph.types import Command

from ai.agents.approval_workflow import build_approval_graph
from ai.memory.checkpointer import create_checkpointer


@pytest.mark.asyncio
async def test_approval_workflow_can_pause_and_execute_after_approval():
    async with create_checkpointer() as checkpointer:
        graph = build_approval_graph(checkpointer)

        config = {
            "configurable": {
                "thread_id": "test-approval-action-001"
            }
        }

        result = await graph.ainvoke(
            {
                "employee_id": "EMP001",
                "department": "hr",
                "action": "create_hr_request",
                "description": "Update bank account details",
            },
            config=config,
        )

        assert "__interrupt__" in result

        result = await graph.ainvoke(
            Command(resume="approved"),
            config=config,
        )

        assert result["approved"] is True
        assert result["action_result"]["success"] is True

@pytest.mark.asyncio
async def test_rejected_approval_does_not_execute_action():
    async with create_checkpointer() as checkpointer:
        graph = build_approval_graph(checkpointer)

        config = {
            "configurable": {
                "thread_id": "test-approval-rejected-001"
            }
        }

        result = await graph.ainvoke(
            {
                "employee_id": "EMP001",
                "department": "hr",
                "action": "create_hr_request",
                "description": "Update bank account details",
            },
            config=config,
        )

        assert "__interrupt__" in result

        result = await graph.ainvoke(
            Command(resume="rejected"),
            config=config,
        )

        assert result["approved"] is False
        assert "action_result" not in result