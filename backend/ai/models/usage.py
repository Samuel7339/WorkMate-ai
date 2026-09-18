MODEL_PRICING = {
    "input": 0.0,
    "output": 0.0,
}

def calculate_cost(input_tokens: int, output_tokens: int) -> float:
    input_cost = (input_tokens / 1_000_000) * MODEL_PRICING["input"]
    output_cost = (output_tokens / 1_000_000) * MODEL_PRICING["output"]

    return input_cost + output_cost

def get_usage(response) -> dict:
    usage = response.usage_metadata or {}

    return {
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
    }

def get_usage_and_cost(response) -> dict:
    usage = get_usage(response)

    cost = calculate_cost(
        usage["input_tokens"],
        usage["output_tokens"],
    )

    return {
        **usage,
        "cost": cost,
    }