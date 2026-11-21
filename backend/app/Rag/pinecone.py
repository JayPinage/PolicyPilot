
from pinecone import Pinecone
from app.config import settings
from langfuse import observe

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)

NAMESPACE = "policypilot"


@observe(
    name="pinecone-upsert",
    as_type="span",
    capture_input=False,
    capture_output=False
)
def upsert_vectors(records: list[dict]):

    if not records:
        return {"upserted_count": 0}

    batch_size = 20
    total_upserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]

        result = index.documents.upsert(
            namespace=NAMESPACE,
            documents=batch
        )

        total_upserted += result.upserted_count

    return {"upserted_count": total_upserted}


@observe(
    name="pinecone-delete",
    as_type="span",
    capture_input=False,
    capture_output=False
)
def delete_vectors(chunk_ids: list[str]):

    if not chunk_ids:
        return

    index.documents.delete(
        namespace=NAMESPACE,
        ids=chunk_ids
    )

@observe(
    name="pinecone-delete-document",
    as_type="span",
    capture_input=False,
    capture_output=False
)
def delete_document_vectors(document_id: str):

    index.documents.delete(
        namespace=NAMESPACE,
        filter={"document_id": {"$eq": document_id}}
    )
