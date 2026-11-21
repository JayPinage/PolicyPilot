
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from langfuse import observe

from app.database.connnection import get_db
from app.models.user import User
from app.models.documents import Document
from app.Auth.dependencies import require_admin

from app.Rag.extract import extract_document
from app.Rag.chunking import chunk_documents
from app.Rag.embedding import embed_documents
from app.Rag.pinecone import upsert_vectors

from sqlalchemy import select
from app.models.documents import Document
from app.Rag.pinecone import delete_document_vectors

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload")
@observe(name="document-ingestion")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    try:
        # 1. Extract document
        extracted_docs = await extract_document(file)

        if not extracted_docs:
            raise HTTPException(400, "No text extracted")

        # 2. Save document metadata
        document = Document(
            filename=file.filename,
            file_type=file.content_type or "unknown",
            uploaded_by=admin.id
        )

        db.add(document)
        await db.flush()

        # 3. Add citation metadata to chunks
        for doc in extracted_docs:
            doc.metadata["document_id"] = str(document.id)
            doc.metadata["source"] = file.filename

        # 4. Chunk document
        chunks = chunk_documents(extracted_docs)

        if not chunks:
            raise HTTPException(400, "No chunks generated")

        # 5. Generate embeddings
        records = embed_documents(chunks)

        # 6. Store in Pinecone
        result = upsert_vectors(records)

        # 7. Commit PostgreSQL record
        await db.commit()

        return {
            "message": "Document uploaded successfully",
            "document_id": document.id,
            "filename": document.filename,
            "chunks_created": len(chunks),
            "vectors_upserted": result["upserted_count"]
        }

    except HTTPException:
        await db.rollback()
        raise

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Document upload failed: {str(e)}"
        )


# List all uploaded documents
@router.get("/")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )

    documents = result.scalars().all()

    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "uploaded_by": doc.uploaded_by,
            "created_at": doc.created_at
        }
        for doc in documents
    ]


# Delete document
@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )

    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(404, "Document not found")

    delete_document_vectors(str(document.id))

    await db.delete(document)
    await db.commit()

    return {"message": "Document deleted successfully"}
