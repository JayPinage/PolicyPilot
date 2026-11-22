
import asyncio
import time

from app.Rag.graph import rag_graph


async def run_test(question):

    start = time.perf_counter()

    result = await rag_graph.ainvoke({
        "question": question,
        "search_query": "",
        "context": [],
        "answer": "",
        "chat_history": [],
        "cache_hit": False
    })

    elapsed = time.perf_counter() - start

    return result, elapsed


async def main():

    questions = [
        "What happens when an employee exhausts all available leaves?",
        "What happens if an employee uses up all their leave entitlement?"
    ]

    results = []

    for i, question in enumerate(questions, 1):

        print(f"\nREQUEST {i}")

        result, elapsed = await run_test(question)

        results.append(elapsed)

        print("Cache hit:", result.get("cache_hit"))
        print(f"Response time: {elapsed:.3f} seconds")

    print("\nPERFORMANCE SUMMARY")
    print(f"Request 1: {results[0]:.3f} seconds")
    print(f"Request 2: {results[1]:.3f} seconds")

    if results[0] > results[1]:
        improvement = (
            (results[0] - results[1]) / results[0]
        ) * 100

        print(f"Latency reduction: {improvement:.2f}%")


if __name__ == "__main__":
    asyncio.run(main())
