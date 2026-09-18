import pytest

from ai.agents.hr_agent import create_hr_agent
from ai.memory.checkpointer import create_checkpointer


@pytest.mark.asyncio
async def test_hr_agent_returns_structured_response():
    async with create_checkpointer() as checkpointer:
        agent = create_hr_agent(checkpointer)

        result = await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "I am EMP001. How many casual leaves do I have?",
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": "test-hr-structured-001"
                }
            },
        )

        response = result["structured_response"]

        assert response.department == "hr"
        assert response.requires_approval is False
        assert response.requires_human is False
        assert response.confidence >= 0.0
        assert response.confidence <= 1.0