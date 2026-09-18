from .checkpointer import create_checkpointer


async def create_memory_enabled_agent():
    checkpointer = create_checkpointer()

    return checkpointer