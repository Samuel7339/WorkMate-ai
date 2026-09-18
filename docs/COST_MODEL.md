# WorkMate AI Cost Model

## Model

WorkMate AI uses:

- Model: `gemini-3.5-flash-lite`
- Provider: Google Gemini
- Pricing basis: Gemini API Standard paid-tier pricing
- Pricing date: September 2026

Official pricing:

- Input: $0.30 per 1 million tokens
- Output: $2.50 per 1 million tokens

The Gemini Developer API free tier may result in $0 actual billing while usage remains within the free quota.

## Measurement

WorkMate AI reads token usage directly from the model response.

The application records:

- Input tokens
- Output tokens
- Total tokens

The measurement is implemented in:

`backend/ai/models/usage.py`

The application uses the provider's `usage_metadata` rather than estimating tokens from characters or words.

## Cost Formula

Input cost:

`input_tokens / 1,000,000 × $0.30`

Output cost:

`output_tokens / 1,000,000 × $2.50`

Total request cost:

`input cost + output cost`

## Example

For a request using:

- 1,000 input tokens
- 500 output tokens

The equivalent paid-tier cost is:

Input:

`1,000 / 1,000,000 × $0.30 = $0.0003`

Output:

`500 / 1,000,000 × $2.50 = $0.00125`

Total:

`$0.00155`

## Why measurement is used

Agent requests can involve multiple model calls because WorkMate AI contains:

- Supervisor routing
- Specialist agents
- Structured output
- RAG
- Summarization
- Retry/fallback behavior

Therefore, cost should be based on actual provider-reported token usage rather than assuming that every user message results in one model call.

## Cost control

WorkMate AI uses several controls:

- Model call limit middleware
- Token usage measurement
- Low-cost Gemini Flash-Lite model
- Deterministic evaluation tests that do not call the LLM
- Retry limits
- Fallback handling

## Limitations

The current cost calculation represents the equivalent Standard paid-tier token cost.

Actual billing can differ because:

- The application may be using the Gemini free tier.
- Pricing can change.
- Retries can create additional model calls.
- Different API features may have separate pricing.

The cost model should therefore be recalculated when the model or provider pricing changes.