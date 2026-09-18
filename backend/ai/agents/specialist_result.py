from langchain.messages import AIMessage, ToolMessage

from ..schemas.specialist_response import SpecialistResponse
from ..schemas.response import WorkMateResponse


def build_specialist_response(
    result: dict,
) -> SpecialistResponse:
    structured_response: WorkMateResponse = result["structured_response"]

    messages = result["messages"]

    answer = ""
    tool_results = []
    sources = []

    for message in messages:
        if isinstance(message, ToolMessage):
            tool_results.append(message.content)

            if isinstance(message.content, list):
                for item in message.content:
                    if isinstance(item, dict):
                        if "source" in item:
                            sources.append(item)

        elif isinstance(message, AIMessage):
            text = getattr(message, "text", "")

            if text:
                answer = text

    return SpecialistResponse(
        response=structured_response,
        answer=answer,
        tool_result=tool_results[-1] if tool_results else None,
        sources=sources,
    )