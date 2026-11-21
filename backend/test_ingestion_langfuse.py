import os
os.environ["LANGFUSE_DEBUG"] = "True"

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from langfuse import get_client, observe
from langchain_core.documents import Document
from app.Rag.extract import extract_txt
from app.Rag.ingestion import ingest_documents_pipeline

@observe(name="test-full-ingestion-run")
def run_test():
    print("Starting ingestion test...")
    
    # 1. Extraction
    sample_text = b"""POLICY PILOT EMPLOYEE LEAVE POLICY 2026
1. Loss of Pay (LOP):
Loss of Pay occurs when an employee takes unpaid leave after exhausting all available paid leaves.
Approval from the reporting manager is mandatory prior to taking LOP.

2. Annual Leave:
Employees are entitled to 18 days of paid annual leave per calendar year.
Leaves must be applied at least 3 days in advance.
"""
    extracted_docs = extract_txt(sample_text, "company_leave_policy.txt")
    print(f"Extracted {len(extracted_docs)} documents.")

    # 2. Ingestion pipeline (parent trace wrapping chunking, embedding, upsert)
    result = ingest_documents_pipeline(
        documents=extracted_docs,
        document_id="policy-doc-test-01",
        source_name="company_leave_policy.txt"
    )
    print("Ingestion pipeline result:", result)
    return result

if __name__ == "__main__":
    run_test()
    print("Flushing Langfuse spans...")
    get_client().flush()
    print("Flush completed!")
