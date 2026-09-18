from langchain.tools import tool

from ..rag.retriever import retriever
from ..security.prompt_injection import contains_prompt_injection


@tool
def search_company_policy(query: str) -> list[dict]:
    """Search approved WorkMate company policy documents."""

    documents = retriever.invoke(query)

    results = []

    for document in documents:
        content = document.page_content

        if contains_prompt_injection(content):
            continue

        results.append(
            {
                "content": content,
                "source": document.metadata.get("source"),
                "page": document.metadata.get("page"),
            }
        )

    return results