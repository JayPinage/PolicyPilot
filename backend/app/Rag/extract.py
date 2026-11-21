# extract from documents

# app/services/extract.py

from pathlib import Path
from io import BytesIO

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from fastapi import UploadFile, HTTPException
from langchain_core.documents import Document



MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

from langfuse import observe

@observe(
    name="document-extraction",
    as_type="span",
    capture_input=False,
    capture_output=False
)


async def extract_document(file: UploadFile) -> list[Document]:
    """
    Extract text from uploaded company policy documents.

    Returns LangChain Document objects ready for chunking.
    """

    if not file.filename:
        raise HTTPException(400, "Filename is missing")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            "Only PDF, DOCX and TXT files are supported"
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(400, "Uploaded file is empty")

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(413, "File exceeds 20 MB limit")

        filename = Path(file.filename).name

        if extension == ".pdf":
            documents = extract_pdf(content, filename)

        elif extension == ".docx":
            documents = extract_docx(content, filename)

        elif extension == ".txt":
            documents = extract_txt(content, filename)

        if not documents:
            raise HTTPException(
                400,
                "No readable text found in document"
            )

        

        return documents

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            422,
            f"Document extraction failed: {str(e)}"
        )

    finally:
        await file.close()


def extract_pdf(content: bytes, filename: str) -> list[Document]:
    """Extract text page by page from PDF."""

    documents = []

    with fitz.open(stream=content, filetype="pdf") as pdf:

        if pdf.is_encrypted:
            raise ValueError("Password-protected PDFs are not supported")

        for page_number, page in enumerate(pdf, start=1):

            text = page.get_text("text").strip()

            if not text:
                continue

            documents.append(
                Document(
                    page_content=clean_text(text),
                    metadata={
                        "source": filename,
                        "file_type": "pdf",
                        "page": page_number
                    }
                )
            )

    return documents


def extract_docx(content: bytes, filename: str) -> list[Document]:
    """Extract paragraphs and tables from DOCX."""

    doc = DocxDocument(BytesIO(content))

    extracted_content = []

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()

        if text:
            extracted_content.append(text)

    # Extract table contents
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(
                cell.text.strip() for cell in row.cells
            )

            if row_text.strip():
                extracted_content.append(row_text)

    text = clean_text("\n".join(extracted_content))

    if not text:
        return []

    return [
        Document(
            page_content=text,
            metadata={
                "source": filename,
                "file_type": "docx",
                "page": None
            }
        )
    ]


def extract_txt(content: bytes, filename: str) -> list[Document]:
    """Extract text from TXT."""

    text = content.decode("utf-8-sig")

    text = clean_text(text)

    if not text:
        return []

    return [
        Document(
            page_content=text,
            metadata={
                "source": filename,
                "file_type": "txt",
                "page": None
            }
        )
    ]


def clean_text(text: str) -> str:
    """Clean unnecessary whitespace."""

    import re

    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
