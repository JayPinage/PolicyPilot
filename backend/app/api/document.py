
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from langfuse import observe

from app.database.connnection import get_db

from app.models.user import User
from app.models.documents import Document

from app.Auth.dependencies import require_admin

from app.Rag.extract import extract_document
from app.Rag.chunking import chunk_documents
from app.Rag.embedding import embed_documents
from app.Rag.pinecone import (
    upsert_vectors,
    delete_document_vectors
)

from app.Rag.semantic_cache import semantic_cache


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)


# ==========================================
# 1. UPLOAD DOCUMENT
# ==========================================

@router.post("/upload")
@observe(
    name="document-ingestion",
    capture_input=False,
    capture_output=False
)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):

    try:

        # 1. Extract document
        extracted_docs = await extract_document(file)

        if not extracted_docs:
            raise HTTPException(
                status_code=400,
                detail="No text extracted from document"
            )

        # 2. Save document metadata
        document = Document(
            filename=file.filename,
            file_type=file.content_type or "unknown",
            uploaded_by=admin.id
        )

        db.add(document)

        await db.flush()

        document_id = str(document.id)

        # 3. Add metadata to extracted documents
        for doc in extracted_docs:

            doc.metadata["document_id"] = document_id
            doc.metadata["source"] = file.filename

        # 4. Chunk document
        chunks = chunk_documents(extracted_docs)

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No chunks generated"
            )

        # 5. Generate embeddings
        records = embed_documents(chunks)

        # 6. Store vectors in Pinecone
        result = upsert_vectors(records)

        # 7. Commit PostgreSQL
        await db.commit()

        # 8. Invalidate old semantic cache
        try:

            semantic_cache.invalidate_all_cache()

            print(
                "Semantic cache invalidated after document upload"
            )

        except Exception as cache_error:

            print(
                f"WARNING: Cache invalidation failed: {cache_error}"
            )

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


# ==========================================
# 2. LIST DOCUMENTS
# ==========================================

@router.get("/")
async def list_documents(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):

    result = await db.execute(
        select(Document).order_by(
            Document.created_at.desc()
        )
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


# ==========================================
# 3. DELETE DOCUMENT
# ==========================================

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):

    # 1. Find document
    result = await db.execute(
        select(Document).where(
            Document.id == document_id
        )
    )

    document = result.scalar_one_or_none()

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    try:

        # 2. Delete vectors from Pinecone
        delete_document_vectors(str(document.id))

        # 3. Delete PostgreSQL record
        await db.delete(document)

        await db.commit()

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Document deletion failed: {str(e)}"
        )

    # 4. Invalidate cached answers referencing this document
    try:

        deleted_count = semantic_cache.invalidate_document_cache(
            str(document_id)
        )

        print(
            f"Invalidated {deleted_count} cached answers"
        )

    except Exception as cache_error:

        print(
            f"WARNING: Cache invalidation failed: {cache_error}"
        )

    return {
        "message": "Document deleted successfully",
        "document_id": document_id
    }
