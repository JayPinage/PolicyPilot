from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from langfuse import observe
from langchain_core.documents import Document
from app.Rag.chunking import chunk_documents
from app.Rag.embedding import embed_documents
from app.Rag.pinecone import upsert_vectors


@observe(name="document-ingestion")
def ingest_documents_pipeline(
    documents: list[Document],
    document_id: str = "doc_test",
    source_name: str = "sample_policy.txt"
) -> dict:
    """
    Parent trace function wrapping ingestion steps into one single trace:
    Extraction (passed in) -> Chunking -> Embedding -> Vector DB Upsert
    """
    if not documents:
        return {"chunks": 0, "vectors_upserted": 0}

    # Attach citation metadata
    for doc in documents:
        doc.metadata["document_id"] = str(document_id)
        doc.metadata["source"] = source_name

    # Step 1: Chunking (child span)
    chunks = chunk_documents(documents)

    # Step 2: Embedding (child span: as_type="embedding")
    records = embed_documents(chunks)

    # Step 3: Pinecone upsert (child span)
    upsert_result = upsert_vectors(records)

    return {
        "chunks_count": len(chunks),
        "records_count": len(records),
        "upsert_result": upsert_result
    }
