from .loader import load_documents
from .chunker import split_documents
from .vector_store import create_vector_store


def create_retriever():
    documents = load_documents()

    chunks = split_documents(documents)

    vector_store = create_vector_store(chunks)

    return vector_store.as_retriever(
        search_kwargs={
            "k": 3,
        }
    )


retriever = create_retriever()