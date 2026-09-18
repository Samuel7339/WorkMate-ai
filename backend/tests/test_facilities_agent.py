import pytest

from ai.agents.facilities_agent import create_facilities_agent
from ai.memory.checkpointer import create_checkpointer
from langchain.messages import ToolMessage


@pytest.mark.asyncio
async def test_facilities_agent_can_check_maintenance_status():
    async with create_checkpointer() as checkpointer:
        agent = create_facilities_agent(checkpointer)

        config = {
            "configurable": {
                "thread_id": "test-facilities-agent-001"
            }
        }

        result = await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the status of FM-001?",
                    }
                ]
            },
            config=config,
        )

        tool_messages = [
            message
            for message in result["messages"]
            if isinstance(message, ToolMessage)
        ]

        assert tool_messages

        tool_content = str(tool_messages[-1].content)

        assert "FM-001" in tool_content
        assert "open" in tool_content.lower()