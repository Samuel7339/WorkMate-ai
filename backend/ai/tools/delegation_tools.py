from langchain.tools import tool
from langchain_core.runnables import RunnableConfig

from ..agents.hr_agent import create_hr_agent
from ..agents.it_agent import create_it_agent
from ..agents.facilities_agent import create_facilities_agent
from ..agents.specialist_result import build_specialist_response


def create_delegation_tools(checkpointer):

    hr_agent = create_hr_agent(checkpointer)
    it_agent = create_it_agent(checkpointer)
    facilities_agent = create_facilities_agent(checkpointer)

    @tool(parse_docstring=True)
    async def ask_hr(
        task: str,
        config: RunnableConfig,
    ) -> str:
        """Delegate an HR-related task to the HR specialist.

        Args:
            task: A complete, self-contained HR task for the specialist.
        """

        parent_thread_id = config["configurable"]["thread_id"]

        result = await hr_agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": f"{parent_thread_id}:hr",
                }
            },
        )

        specialist_response = build_specialist_response(result)

        return specialist_response.model_dump_json()

    @tool(parse_docstring=True)
    async def ask_it(
        task: str,
        config: RunnableConfig,
    ) -> str:
        """Delegate an IT-related task to the IT specialist.

        Args:
            task: A complete, self-contained IT task for the specialist.
        """

        parent_thread_id = config["configurable"]["thread_id"]

        result = await it_agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": f"{parent_thread_id}:it",
                }
            },
        )

        specialist_response = build_specialist_response(result)

        return specialist_response.model_dump_json()

    @tool(parse_docstring=True)
    async def ask_facilities(
        task: str,
        config: RunnableConfig,
    ) -> str:
        """Delegate a Facilities-related task to the Facilities specialist.

        Args:
            task: A complete, self-contained Facilities task for the specialist.
        """

        parent_thread_id = config["configurable"]["thread_id"]

        result = await facilities_agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": task,
                    }
                ]
            },
            config={
                "configurable": {
                    "thread_id": f"{parent_thread_id}:facilities",
                }
            },
        )

        specialist_response = build_specialist_response(result)

        return specialist_response.model_dump_json()

    return [
        ask_hr,
        ask_it,
        ask_facilities,
    ]