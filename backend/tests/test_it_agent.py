import pytest

from ai.agents.it_agent import create_it_agent
from ai.memory.checkpointer import create_checkpointer
from langchain.messages import ToolMessage


@pytest.mark.asyncio
async def test_it_agent_can_check_ticket_status():
    async with create_checkpointer() as checkpointer:
        agent = create_it_agent(checkpointer)

        config = {
            "configurable": {
                "thread_id": "test-it-agent-001"
            }
        }

        result = await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": "What is the status of IT-001?",
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

        assert "IT-001" in tool_content
        assert "open" in tool_content.lower()