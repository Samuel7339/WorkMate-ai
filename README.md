# WorkMate AI

WorkMate AI is an AI-powered employee helpdesk and operations assistant.

It helps employees with:

- HR requests
- IT support
- Facilities issues
- Company policy questions

The system uses a supervisor agent that routes requests to specialized HR, IT, and Facilities agents.

## Features

- AI-powered employee helpdesk
- Supervisor and specialist agent architecture
- HR, IT, and Facilities specialists
- Company policy RAG with source and page citations
- Persistent conversation memory
- Structured AI responses using Pydantic
- Action tools for HR, IT, and Facilities
- Human approval workflow for protected actions
- Human escalation for low-confidence requests
- Prompt-injection protection
- Tool-output security controls
- Streaming model support
- Async agent execution
- Retry and fallback support
- Model call limits
- LangGraph checkpointing
- Conversation summarization
- LangSmith tracing
- Deterministic evaluation suite
- GitHub Actions CI

## Architecture

                         ┌──────────────────┐
                         │     Employee     │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  React Frontend  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   FastAPI API    │
                         └────────┬─────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │     Supervisor Agent     │
                    │   Understand & Route     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
       │  HR Agent   │    │  IT Agent   │    │ Facilities   │
       │             │    │             │    │    Agent     │
       └──────┬──────┘    └──────┬──────┘    └──────┬───────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Tools + RAG         │
                    │                         │
                    │ • Database tools        │
                    │ • Policy retrieval      │
                    │ • Source citations      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Structured Response   │
                    │      Pydantic Schema    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Action Router      │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
          ┌──────────┐    ┌─────────────┐   ┌─────────────┐
          │ Complete │    │   Approval  │   │  Escalation │
          │  Answer  │    │   Required  │   │ Human Help  │
          └──────────┘    └──────┬──────┘   └─────────────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │ Human Reviewer   │
                       └────────┬─────────┘
                                │
                         ┌──────┴──────┐
                         │             │
                         ▼             ▼
                    ┌─────────┐   ┌─────────┐
                    │ Approve │   │ Reject  │
                    └────┬────┘   └────┬────┘
                         │             │
                         ▼             ▼
                    Execute Tool    Stop Action