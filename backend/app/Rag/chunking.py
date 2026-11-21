
# app/services/chunking.py

import hashlib

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Chunking configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150




text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=[
        "\n\n",
        "\n",
        ". ",
        " ",
        ""
    ],
    length_function=len,
)
from langfuse import observe

@observe(
    name="document-chunking",
    as_type="span",
    capture_input=False,
    capture_output=False
)

def generate_chunk_id(
    source: str,
    page: int | None,
    chunk_index: int,
    content: str
) -> str:
    """Generate a deterministic unique chunk ID."""

    raw_id = (
        f"{source}:{page}:{chunk_index}:{content}"
    )

    return hashlib.sha256(
        raw_id.encode("utf-8")
    ).hexdigest()


def chunk_documents(
    documents: list[Document]
) -> list[Document]:
    """
    Split extracted documents into chunks.

    Preserves original metadata and adds:
    - chunk_id
    - chunk_index
    """

    if not documents:
        return []

    chunked_documents = []

    for document in documents:

        chunks = text_splitter.split_text(
            document.page_content
        )

        for index, chunk in enumerate(chunks):

            metadata = document.metadata.copy()

            chunk_id = generate_chunk_id(
                source=metadata.get("source", "unknown"),
                page=metadata.get("page"),
                chunk_index=index,
                content=chunk
            )

            metadata.update({
                "chunk_id": chunk_id,
                "chunk_index": index
            })

            chunked_documents.append(
                Document(
                    page_content=chunk,
                    metadata=metadata
                )
            )

    return chunked_documents
