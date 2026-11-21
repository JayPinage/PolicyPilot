from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from langfuse import get_client
from app.Rag.graph import rag_graph

result = rag_graph.invoke({
    "question": "What is the Loss of Pay policy?",
    "context": [],
    "answer": ""
})

print(result["answer"])

# Flush all batched traces to Langfuse before script exits
get_client().flush()
