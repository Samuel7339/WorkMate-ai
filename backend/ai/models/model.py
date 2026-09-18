from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, SystemMessage

from ..schemas.response import WorkMateResponse
from .config import AGENT_MODEL, FALLBACK_MODEL
from .usage import get_usage_and_cost


model = init_chat_model(
    AGENT_MODEL,
    model_provider="google_genai",
)


fallback_model = init_chat_model(
    FALLBACK_MODEL,
    model_provider="google_genai",
)


resilient_model = (
    model
    .with_retry(
        stop_after_attempt=2,
    )
    .with_fallbacks(
        [fallback_model]
    )
)


structured_model = model.with_structured_output(
    WorkMateResponse
)


def ask_model(prompt: str):
    return resilient_model.invoke(prompt)


def ask_model_with_usage(prompt: str):
    response = resilient_model.invoke(prompt)

    usage = get_usage_and_cost(response)

    return response, usage


def ask_model_with_system(
    system_prompt: str,
    user_prompt: str,
):
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]

    return resilient_model.invoke(messages)


def stream_model(prompt: str):
    return resilient_model.stream(prompt)


async def ask_model_async(prompt: str):
    return await resilient_model.ainvoke(prompt)