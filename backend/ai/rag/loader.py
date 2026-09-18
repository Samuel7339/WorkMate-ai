from pathlib import Path

from langchain_community.document_loaders import PyPDFDirectoryLoader


DOCUMENTS_PATH = Path(__file__).resolve().parents[2] / "data" / "documents"


def load_documents():
    loader = PyPDFDirectoryLoader(
        str(DOCUMENTS_PATH)
    )

    documents = loader.load()

    return documents

