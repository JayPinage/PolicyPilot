class CacheMetrics:

    def __init__(self):
        self.hits = 0
        self.misses = 0

    def record_hit(self):
        self.hits += 1

    def record_miss(self):
        self.misses += 1

    def get_stats(self):
        total = self.hits + self.misses

        hit_rate = (
            self.hits / total * 100
            if total else 0
        )

        return {
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_rate": round(hit_rate, 2)
        }


cache_metrics = CacheMetrics()