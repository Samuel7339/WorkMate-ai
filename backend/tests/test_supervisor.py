import uuid

import pytest

from ai.agents.supervisor import create_supervisor
from ai.agents.facilities_agent import create_facilities_agent
from ai.memory.checkpointer import create_checkpointer


def new_thread_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4()}"


@pytest.mark.asyncio
async def test_supervisor_routes_hr_request():
    async with create_checkpointer() as checkpointer:
        supervisor = create_supervisor(checkpointer)

        result = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            "I am EMP001. "
                            "How many casual leaves and sick leaves do I have?"
                        ),
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": new_thread_id("supervisor-hr")
                }
            },
        )

        answer = result["messages"][-1].text

        assert "5" in answer
        assert "3" in answer


@pytest.mark.asyncio
async def test_supervisor_routes_it_request():
    async with create_checkpointer() as checkpointer:
        supervisor = create_supervisor(checkpointer)

        result = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the status of IT-001?",
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": new_thread_id("supervisor-it")
                }
            },
        )

        answer = result["messages"][-1].text

        assert "IT-001" in answer
        assert "open" in answer.lower()


@pytest.mark.asyncio
async def test_supervisor_routes_facilities_request():
    async with create_checkpointer() as checkpointer:
        supervisor = create_supervisor(checkpointer)

        result = await supervisor.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the status of FM-001?",
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": new_thread_id("supervisor-facilities")
                }
            },
        )

        answer = result["messages"][-1].text

        assert "FM-001" in answer
        assert "open" in answer.lower()


@pytest.mark.asyncio
async def test_facilities_agent_directly():
    async with create_checkpointer() as checkpointer:
        agent = create_facilities_agent(checkpointer)

        result = await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the status of FM-001?",
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": new_thread_id("direct-facilities")
                }
            },
        )

        print("\nMESSAGES:")

        for message in result["messages"]:
            print(message)

        print("\nSTRUCTURED:")

        print(result["structured_response"])

        assert result["structured_response"] is not None

        assert (
            result["structured_response"].intent
            == "check_maintenance_status"
        )

        assert (
            result["structured_response"].requires_human
            is False
        )