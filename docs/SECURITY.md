# WorkMate AI Security Review

## 1. Security Scope

WorkMate AI handles employee workplace requests related to:

- HR
- IT
- Facilities
- Company policies

The system uses AI agents, tools, RAG, persistent memory, and human approval workflows.

---

## 2. Security Controls

### Prompt Injection Protection

WorkMate AI checks retrieved policy content for known prompt-injection patterns before returning it to the agent.

Examples of blocked patterns include:

- Ignore previous instructions
- Ignore the system prompt
- Reveal system prompt
- Reveal hidden instructions
- Disregard previous instructions

Implementation:

`backend/ai/security/prompt_injection.py`

The evaluation suite includes prompt-injection test cases.

---

### Tool Output Protection

Tool outputs are treated as untrusted data.

The supervisor instructions explicitly prevent the agent from following instructions contained inside tool results.

The system does not allow tool output to override system instructions.

---

### Secret Protection

Environment variables are stored in `.env`.

The `.env` file is excluded from Git using `.gitignore`.

API keys and other environment secrets are therefore not committed to the repository.

---

### Structured Output

AI specialist responses are validated using the `WorkMateResponse` Pydantic schema.

This restricts important fields such as:

- Department
- Confidence
- Approval requirement
- Human escalation requirement

Invalid department values are rejected by the schema.

---

### Human Approval

Actions that require approval do not execute immediately.

The workflow:

1. Detects that approval is required.
2. Creates an approval interrupt.
3. Waits for a reviewer decision.
4. Executes the action only after approval.
5. Does not execute the action after rejection.

Implementation:

`backend/ai/agents/approval_workflow.py`

---

### Human Escalation

Requests with low confidence or an explicit human requirement are routed to escalation instead of being automatically completed.

The current confidence threshold is `0.70`.

Implementation:

`backend/ai/security/escalation.py`

---

### RAG Document Filtering

Policy documents are retrieved from the approved document corpus.

Retrieved documents are checked for prompt-injection patterns before being returned by the policy search tool.

Implementation:

`backend/ai/tools/rag_tools.py`

---

## 3. Authorization

The project contains authorization logic for identifying whether a user is allowed to perform protected operations.

The approval workflow is also separated from the employee chatbot.

Employees receive a message that their request was sent for review, while approval is handled through the reviewer approval page.

---

## 4. Security Testing

The project includes tests covering:

- Prompt injection
- RAG security
- Authorization
- Approval workflow
- Escalation
- Action routing
- Structured responses

The deterministic evaluation suite contains 30 cases.

Latest evaluation result:

`30/30 passed`

The evaluation suite can be run with:

```text
python -m evaluation.run_evaluation