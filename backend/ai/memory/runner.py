import asyncio

from ..agents.hr_agent import create_hr_agent
from .checkpointer import create_checkpointer


async def main():
    async with create_checkpointer() as checkpointer:
        agent = create_hr_agent(checkpointer)

        thread_id = "EMP001-rag-test-2"

        while True:
            message = input("You: ")

            if message.lower() == "exit":
                break

            result = await agent.ainvoke(
                {"messages": [{"role": "user", "content": message}]},
                config={    
                    "configurable": {
                        "thread_id": thread_id
                    }
                },
            )

            print("AI:", result["messages"][-1].text)


if __name__ == "__main__":
    asyncio.run(main())