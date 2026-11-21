from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import os
from langfuse import Langfuse, get_client, is_default_export_span

# Initialize Langfuse client with should_export_span combined with is_default_export_span
# to allow third-party OpenTelemetry instrumentation spans alongside Langfuse spans.
langfuse = Langfuse(
    public_key=os.environ.get("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.environ.get("LANGFUSE_SECRET_KEY"),
    base_url=os.environ.get("LANGFUSE_BASE_URL", "https://us.cloud.langfuse.com"),
    should_export_span=lambda span: is_default_export_span(span) or True,
    debug=os.environ.get("LANGFUSE_DEBUG", "False").lower() in ("true", "1")
)
