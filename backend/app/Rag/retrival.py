
from pinecone import Pinecone, DenseVectorQuery, TextQuery
from app.config import settings
from app.Rag.embedding import embeddings_model
from sentence_transformers import CrossEncoder

pc = Pinecone(api_key=settings.PINECONE_API_KEY)
index = pc.Index(settings.PINECONE_INDEX_NAME)

NAMESPACE = "policypilot"

reranker = CrossEncoder(
    "BAAI/bge-reranker-base",
    device="cpu"
)


def reciprocal_rank_fusion(
    semantic_results,
    keyword_results,
    k=60
):
    scores = {}
    documents = {}

    result_lists = [
        semantic_results.matches,
        keyword_results.matches
    ]

    for result_list in result_lists:
        for rank, match in enumerate(result_list, start=1):
            doc_id = match.id

            scores[doc_id] = scores.get(doc_id, 0) + (
                1 / (k + rank)
            )

            documents[doc_id] = match

    ranked_results = sorted(
        documents.values(),
        key=lambda match: scores[match.id],
        reverse=True
    )

    return [
        {
            "id": match.id,
            "rrf_score": scores[match.id],
            "title": match.title,
            "page": match.page,
            "chunk_text": match.chunk_text,
            "document_id": match.document_id
        }
        for match in ranked_results
    ]


def rerank_results(query: str, results: list, top_k: int = 5):

    pairs = [
        (query, result["chunk_text"])
        for result in results
    ]

    scores = reranker.predict(pairs)

    for result, score in zip(results, scores):
        result["rerank_score"] = float(score)

    ranked_results = sorted(
        results,
        key=lambda x: x["rerank_score"],
        reverse=True
    )

    return ranked_results[:top_k]


def hybrid_search(query: str, top_k: int = 5):

    query_vector = embeddings_model.embed_query(query)

    # 1. Semantic search
    semantic_results = index.documents.search(
        namespace=NAMESPACE,
        top_k=top_k,
        score_by=[
            DenseVectorQuery(
                field="embedding",
                values=query_vector
            )
        ],
        include_fields=[
            "chunk_text", "title", "page", "document_id"
        ]
    )

    # 2. Keyword search
    keyword_results = index.documents.search(
        namespace=NAMESPACE,
        top_k=top_k,
        score_by=[
            TextQuery(
                query=query,
                fields=["chunk_text"]
            )
        ],
        include_fields=[
            "chunk_text", "title", "page", "document_id"
        ]
    )

    # 3. RRF fusion
    rrf_results = reciprocal_rank_fusion(
        semantic_results,
        keyword_results
    )

    # 4. Reranking
    return rerank_results(
        query,
        rrf_results,
        top_k=5
    )
