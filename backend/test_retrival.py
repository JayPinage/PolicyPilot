from app.Rag.retrival import hybrid_search

query = "What is the company's Loss of Pay policy?"

results = hybrid_search(query, top_k=5)
for result in results:
    print("\nRRF Score:", result["rrf_score"])
    print("Rerank Score:", result["rerank_score"])
    print("Document:", result["title"])
    print("Page:", result["page"])
    print("Text:", result["chunk_text"])