# WorkMate AI — Privacy Notes

## 1. Purpose

WorkMate AI stores limited conversation state so that employees can continue conversations without losing previous context.

The stored conversation state is used only to support the application's conversation and workflow functionality.

## 2. What is stored

The application may persist:

* Conversation messages
* Conversation state required by the agent
* Tool execution state required to continue a workflow
* Thread ID used to identify a conversation

The conversation state is stored using the LangGraph SQLite checkpointer.

## 3. Why the data is stored

Conversation state is stored to provide:

* Multi-turn conversations
* Conversation continuity
* Workflow persistence
* Recovery when an application process is restarted

For example:

Employee:

> How many casual leaves do I have?

AI:

> You have 5 casual leaves.

Employee:

> What about sick leave?

The agent can use the previous conversation context to understand that the employee is asking about their own leave balance.

## 4. Thread IDs

Each conversation uses a `thread_id`.

The `thread_id` identifies a conversation thread and allows the checkpointer to retrieve the corresponding state.

The final application should avoid using a fixed thread ID for every employee.

A conversation identifier should be generated or supplied by the application so that different conversations remain separated.

Example:

```text
EMP001-chat-001
EMP001-chat-002
EMP002-chat-001
```

## 5. Employee data

Employee master data and live operational information should not be treated as conversation memory.

For example:

* Employee records belong in the appropriate employee data source.
* IT ticket information belongs in the IT system.
* Facilities ticket information belongs in the facilities system.
* Company policy information belongs in the RAG document corpus.

The checkpointer is intended for conversation and workflow state, not as the primary database for these systems.

## 6. Policy documents

Company policy documents used for RAG are stored separately from conversation memory.

The document corpus is located under:

```text
backend/data/documents/
```

These documents are used as knowledge sources for answering employee questions.

## 7. Long conversations

Long conversations can cause the amount of context sent to the model to grow.

WorkMate uses LangChain's summarization middleware to manage long conversations.

Older conversation history can be summarized while recent messages are retained.

This reduces unnecessary context growth while preserving useful conversation information.

## 8. API keys and secrets

API keys and other secrets must not be stored in source code.

Secrets are loaded from environment variables.

The `.env` file must not be committed to Git.

The project `.gitignore` should exclude:

```text
.env
.venv/
```

## 9. Logging

Application logs should avoid unnecessarily exposing:

* API keys
* Authentication tokens
* Sensitive employee information
* Complete private conversations

Only information required for debugging, monitoring, security, and auditing should be logged.

## 10. Development data

The current project uses sample employee and ticket data for development.

These records are not intended to represent real employee records.

Before production deployment, the application should use the organization's approved data sources and access controls.

## 11. Data deletion

The production application should provide an appropriate process for deleting or retaining conversation data according to the organization's data-retention requirements.

The current development implementation does not define a production retention policy.

## 12. Current limitation

The current WorkMate prototype uses SQLite for persistent conversation state.

SQLite is suitable for the current development and capstone environment, but a production deployment may require a managed database and appropriate access controls, backups, encryption, retention, and monitoring.

## 13. Security principle

Conversation memory should contain only the information required for the application to perform its intended function.

Employee identity, operational records, company documents, and conversation state should remain logically separated.
