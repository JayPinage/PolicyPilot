
import json
import uuid
import numpy as np
import redis

from redis.commands.search.field import TextField, VectorField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query

from app.config import settings
from app.Rag.embedding import embeddings_model


class SemanticCache:

    def __init__(self):
        self.redis = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=False
        )

        self.index_name = "semantic_cache_idx"
        self.dimension = 768

    def create_index(self):
        try:
            self.redis.ft(self.index_name).info()
            return
        except Exception:
            pass

        schema = (
    TextField("question"),
    TextField("answer"),
    TextField("citations"),
    TextField("context"),  # ADD THIS
    VectorField(
        "embedding",
        "HNSW",
        {
            "TYPE": "FLOAT32",
            "DIM": self.dimension,
            "DISTANCE_METRIC": "COSINE"
        }
    )
)

        definition = IndexDefinition(
            prefix=["cache:"],
            index_type=IndexType.HASH
        )

        self.redis.ft(self.index_name).create_index(
            schema,
            definition=definition
        )

    def get_embedding(self, question):
        vector = embeddings_model.embed_query(question)
        return np.asarray(vector, dtype=np.float32)

    def get_cached_answer(self, question):
        vector = self.get_embedding(question)

        query = (
            Query("*=>[KNN 1 @embedding $vec AS vector_distance]")
            .return_fields(
                 "question",
    "answer",
    "citations",
    "context",
    "vector_distance"
            )
            .dialect(2)
        )

        results = self.redis.ft(self.index_name).search(
            query,
            query_params={"vec": vector.tobytes()}
        )

      

        if not results.docs:
            return None

        result = results.docs[0]
        distance = float(result.vector_distance)
        similarity = 1.0 - distance

        print("Similarity score:", similarity)
        print("Required threshold:", settings.REDIS_CACHE_THRESHOLD)

        if similarity < settings.REDIS_CACHE_THRESHOLD:
            return None

        return {
    "answer": result.answer,
    "citations": json.loads(result.citations),
    "context": json.loads(result.context),
    "similarity": similarity
}

    def store_answer(self, question, answer, citations, context):
        vector = self.get_embedding(question)

        cache_id = str(uuid.uuid4())

        self.redis.hset(
        f"cache:{cache_id}",
        mapping={
            "question": question,
            "answer": answer,
            "citations": json.dumps(citations),
            "context": json.dumps(context),
            "embedding": vector.tobytes()
        }
    )

        self.redis.expire(
        f"cache:{cache_id}",
        settings.REDIS_CACHE_TTL
    )

    
    def invalidate_document_cache(self, document_id):
        keys = self.redis.keys("cache:*")

        deleted = 0

        for key in keys:
            context_raw = self.redis.hget(key, "context")

            if not context_raw:
                continue

            context = json.loads(context_raw)

            if any(
                str(item.get("document_id")) == str(document_id)
                for item in context
        ):
                self.redis.delete(key)
                deleted += 1

        print(f"Invalidated {deleted} cache entries")
        return deleted

    
    def invalidate_all_cache(self):
        deleted = 0

        for key in self.redis.scan_iter(match="cache:*"):
            self.redis.delete(key)
            deleted += 1

        print(f"Invalidated all cache entries: {deleted}")
        return deleted


    def invalidate_document_cache(self, document_id):
        deleted = 0

        for key in self.redis.scan_iter(match="cache:*"):
            context_raw = self.redis.hget(key, "context")

            if not context_raw:
                continue

            context = json.loads(context_raw)

            if any(
                str(item.get("document_id")) == str(document_id)
                for item in context
        ):
                self.redis.delete(key)
                deleted += 1

        print(f"Invalidated {deleted} entries for document {document_id}")
        return deleted



semantic_cache = SemanticCache()
