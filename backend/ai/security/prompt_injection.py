def contains_prompt_injection(text: str) -> bool:
    suspicious_patterns = [
        "ignore previous instructions",
        "ignore all previous instructions",
        "ignore the system prompt",
        "reveal system prompt",
        "reveal hidden instructions",
        "disregard previous instructions",
    ]

    text_lower = text.lower()

    return any(
        pattern in text_lower
        for pattern in suspicious_patterns
    )