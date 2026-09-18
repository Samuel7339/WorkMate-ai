from langgraph.graph import StateGraph, MessagesState, START, END

from ..models.model import model

async def call_model(state: MessagesState):
    response = await model.ainvoke(state["messages"])

    return {
        "messages": [response]
    }


def build_conversation_graph(checkpointer):
    builder = StateGraph(MessagesState)

    builder.add_node("model", call_model)

    builder.add_edge(START, "model")
    builder.add_edge("model", END)

    return builder.compile(
        checkpointer=checkpointer
    )