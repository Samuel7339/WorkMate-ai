from langchain_core.vectorstores import InMemoryVectorStore

from .embeddings import get_embeddings


def create_vector_store(documents):
    embeddings = get_embeddings()

    vector_store = InMemoryVectorStore.from_documents(
        documents=documents,
        embedding=embeddings,
    )

    return vector_store