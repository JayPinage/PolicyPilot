
from typing import TypedDict, List

from langchain_openai import ChatOpenAI
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    AIMessage
)
from app.Rag.cahe_matrics import cache_metrics

from langgraph.graph import StateGraph, START, END

from langfuse import observe, get_client

from app.Rag.retrival import hybrid_search
from app.Rag.guardrails import (
    process_user_query,
    validate_llm_output,
    verify_citations
)

from app.config import settings
from app.Prompt.system import SYSTEMPROMPT
from app.Rag.semantic_cache import semantic_cache


# Langfuse client
langfuse = get_client()


# Groq LLM configuration
llm = ChatOpenAI(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    temperature=0,
    streaming=True,
    stream_usage=True
)


# RAG state
class RAGState(TypedDict):
    question: str
    search_query: str
    context: List[dict]
    answer: str
    chat_history: List[dict]
    cache_hit: bool


# Record token usage in Langfuse
def record_token_usage(usage: dict):

    if not usage:
        return

    langfuse.update_current_generation(
        model=settings.GROQ_MODEL,
        usage_details={
            "input": usage.get("input_tokens", 0),
            "output": usage.get("output_tokens", 0),
            "total": usage.get("total_tokens", 0)
        }
    )


# 1. Input guardrails
@observe(
    name="input-guardrail",
    as_type="guardrail",
    capture_input=False,
    capture_output=False
)
def input_guardrail_node(state: RAGState):

    safe_question = process_user_query(
        state["question"]
    )

    return {
        "question": safe_question
    }


# 2. Query rewriting
@observe(
    name="query-rewriting",
    as_type="generation",
    capture_input=False,
    capture_output=False
)
async def rewrite_query_node(state: RAGState):

    history = "\n".join(
        f"{msg['role']}: {msg['content']}"
        for msg in state.get("chat_history", [])
    )

    response = await llm.ainvoke([
        SystemMessage(content="""
You are a search query rewriting assistant.

Convert the user's latest question into a standalone
search query using the conversation history.

Rules:
- Resolve references such as it, that and they.
- Preserve the user's original intent.
- Include relevant HR policy terminology.
- Do not answer the question.
- Return only the rewritten search query.
"""),
        HumanMessage(content=f"""
Conversation history:
{history}

Latest question:
{state['question']}

Rewritten search query:
""")
    ])

    # Track rewriting token usage
    if response.usage_metadata:
        record_token_usage(response.usage_metadata)

    search_query = response.content.strip()

    if not search_query:
        search_query = state["question"]

    return {
        "search_query": search_query
    }


# 3. Hybrid retrieval + RRF + reranking
@observe(
    name="hybrid-retrieval",
    as_type="retriever",
    capture_input=False,
    capture_output=False
)
def retrieve_node(state: RAGState):

    results = hybrid_search(
        query=state["search_query"],
        top_k=5
    )

    if not results:
        raise ValueError("No relevant policy documents found.")

    return {
        "context": results
    }


# 4. LLM generation
@observe(
    name="answer-generation",
    as_type="generation",
    capture_input=False,
    capture_output=False
)
async def generate_node(state: RAGState):

    context = "\n\n".join(
        f"Document: {item['title']}\n"
        f"Page: {item['page']}\n"
        f"Content: {item['chunk_text']}"
        for item in state["context"]
    )

    # Convert PostgreSQL history into LangChain messages
    history_messages = []

    for message in state.get("chat_history", []):

        if message["role"] == "user":
            history_messages.append(
                HumanMessage(content=message["content"])
            )

        elif message["role"] == "assistant":
            history_messages.append(
                AIMessage(content=message["content"])
            )

    messages = [
        SystemMessage(content=SYSTEMPROMPT),
        *history_messages,
        HumanMessage(content=f"""
Current Question: {state['question']}

Retrieved Policy Context:
{context}
""")
    ]

    answer = ""
    token_usage = {}

    # Stream LLM tokens internally
    async for chunk in llm.astream(messages):

        if isinstance(chunk.content, str):
            answer += chunk.content

        # Usage is generally supplied in the final stream chunk
        if chunk.usage_metadata:
            token_usage = chunk.usage_metadata

    # Record token usage in Langfuse
    if token_usage:
        record_token_usage(token_usage)

    # Validate generated answer
    answer = validate_llm_output(
        answer,
        state["context"]
    )

    # Verify document and page citations
    answer = verify_citations(
        answer,
        state["context"]
    )

    return {
        "answer": answer
    }




def cache_lookup_node(state):

    if state.get("chat_history"):
        return {"cache_hit": False}

    try:
        cached = semantic_cache.get_cached_answer(
            state["question"]
        )

        if cached:
            cache_metrics.record_hit()
            print(
                f"SEMANTIC CACHE HIT: {cached['similarity']:.4f}"
            )

            # Validate cached answer and citations
            answer = validate_llm_output(
                cached["answer"],
                cached["context"]
            )

            answer = verify_citations(
                answer,
                cached["context"]
            )

            return {
                "answer": answer,
                "context": cached["context"],
                "cache_hit": True
            }

        print("SEMANTIC CACHE MISS")
        cache_metrics.record_miss()

    except Exception as e:
        print(f"Cache lookup/validation error: {e}")

    return {"cache_hit": False}



def cache_store_node(state):

    if state.get("chat_history"):
        return {}

    citations = [
        {
            "document": item["title"],
            "page": item["page"]
        }
        for item in state["context"]
    ]

    try:
        semantic_cache.store_answer(
            question=state["question"],
            answer=state["answer"],
            citations=citations,
            context=state["context"]
        )

        print("ANSWER STORED IN SEMANTIC CACHE")

    except Exception as e:
        print(f"Cache storage error: {e}")

    return {}



# 5. Build LangGraph workflow
def route_after_cache(state):
    if state.get("cache_hit"):
        return "hit"

    return "miss"


builder = StateGraph(RAGState)

builder.add_node("input_guardrail", input_guardrail_node)
builder.add_node("cache_lookup", cache_lookup_node)
builder.add_node("rewrite_query", rewrite_query_node)
builder.add_node("retrieve", retrieve_node)
builder.add_node("generate", generate_node)
builder.add_node("cache_store", cache_store_node)

builder.add_edge(START, "input_guardrail")
builder.add_edge("input_guardrail", "cache_lookup")

builder.add_conditional_edges(
    "cache_lookup",
    route_after_cache,
    {
        "hit": END,
        "miss": "rewrite_query"
    }
)

builder.add_edge("rewrite_query", "retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", "cache_store")
builder.add_edge("cache_store", END)

rag_graph = builder.compile()
