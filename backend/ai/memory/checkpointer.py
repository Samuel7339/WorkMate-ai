from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


DB_PATH = "workmate_memory.db"


def create_checkpointer():
    return AsyncSqliteSaver.from_conn_string(DB_PATH)

async def delete_thread_memory(checkpointer, thread_id: str):
    await checkpointer.adelete_thread(thread_id)