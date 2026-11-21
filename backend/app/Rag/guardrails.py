
import re
import unicodedata

from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer


analyzer = AnalyzerEngine()

# Custom Indian PII recognizers
aadhaar = PatternRecognizer(
    supported_entity="IN_AADHAAR",
    patterns=[
        Pattern(
            name="aadhaar",
            regex=r"\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b",
            score=0.85
        )
    ]
)

pan = PatternRecognizer(
    supported_entity="IN_PAN",
    patterns=[
        Pattern(
            name="pan",
            regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
            score=0.9
        )
    ]
)

analyzer.registry.add_recognizer(aadhaar)
analyzer.registry.add_recognizer(pan)


# Basic prompt injection detection
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"show\s+(your\s+)?hidden\s+instructions",
    r"act\s+as\s+an\s+unrestricted",
    r"bypass\s+(your\s+)?safety",
    r"ignore\s+your\s+rules",
]

def verify_citations(answer: str, context: list) -> str:

    citations = re.findall(
        r"\[Source:\s*(.+?),\s*Page:\s*(\d+(?:\.0)?)\]",
        answer
    )

    if not citations:
        raise ValueError("No valid citations found.")

    valid_sources = {
        (
            item["title"],
            str(int(float(item["page"])))
        )
        for item in context
        if item.get("title") and item.get("page") is not None
    }

    for title, page in citations:
        if (title.strip(), str(int(float(page)))) not in valid_sources:
            raise ValueError(
                f"Invalid citation: {title}, page {page}"
            )

    return answer


def validate_query(query: str) -> str:

    if not isinstance(query, str):
        raise ValueError("Invalid question format.")

    query = unicodedata.normalize("NFKC", query).strip()

    if not query:
        raise ValueError("Please enter a question.")

    if len(query) > 2000:
        raise ValueError("Question exceeds 2000 characters.")

    if any(unicodedata.category(c) == "Cc" and c not in "\n\t"
           for c in query):
        raise ValueError("Question contains invalid control characters.")

    # Prompt injection checks
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            raise ValueError(
                "Your question contains potentially unsafe instructions."
            )

    return query


def detect_and_redact_pii(query: str) -> str:

    findings = analyzer.analyze(
        text=query,
        language="en"
    )

    # Replace detected PII from right to left to preserve offsets
    for finding in sorted(
        findings,
        key=lambda item: item.start,
        reverse=True
    ):
        query = (
            query[:finding.start]
            + f"[REDACTED_{finding.entity_type}]"
            + query[finding.end:]
        )

    return query


def validate_llm_output(answer: str, context: list) -> str:

    if not answer or not answer.strip():
        raise ValueError("The AI generated an empty response.")

    if not context:
        raise ValueError("No policy context available.")

    if len(answer) > 10000:
        raise ValueError("Generated response is too long.")

    if not re.search(r"\[Source:\s*.+?,\s*Page:\s*\d+(?:\.0)?\]",
    answer):
            raise ValueError(
        "The generated answer does not contain valid citations."
    )

    return answer


def process_user_query(query: str) -> str:

    query = validate_query(query)
    query = detect_and_redact_pii(query)

    return query
