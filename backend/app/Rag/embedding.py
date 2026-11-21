
from langchain_huggingface import HuggingFaceEmbeddings
from langfuse import observe
import os

embeddings_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-base-en-v1.5",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)


@observe(
    name="document-embedding",
    as_type="span",
    capture_input=False,
    capture_output=False
)


def embed_documents(chunks):
    texts = [chunk.page_content for chunk in chunks]
    vectors = embeddings_model.embed_documents(texts)

    records = []
    for chunk, vector in zip(chunks, vectors):
        metadata = chunk.metadata
        page = metadata.get("page")          # add this line

        records.append({
            "_id": metadata["chunk_id"],
            "embedding": vector,
            "chunk_text": chunk.page_content,
            "title": os.path.basename(metadata.get("source", "Unknown")),
            "page": page + 1 if page is not None else 0,   # changed
            "document_id": metadata.get("document_id", "unknown"),
        })

    return records
