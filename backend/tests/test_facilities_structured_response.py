import pytest

from ai.agents.facilities_agent import create_facilities_agent
from ai.memory.checkpointer import create_checkpointer


@pytest.mark.asyncio
async def test_facilities_agent_returns_structured_response():
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
                    "thread_id": "test-facilities-structured-001"
                }
            },
        )

        response = result["structured_response"]

        assert response.department == "facilities"
        assert response.requires_approval is False
        assert response.requires_human is False
        assert 0.0 <= response.confidence <= 1.0