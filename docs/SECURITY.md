# WorkMate AI — Security Review

## 1. Scope

This document describes the security controls and known limitations of the WorkMate AI employee helpdesk application.

WorkMate handles:

* Employee requests
* HR, IT, and Facilities information
* Company policy documents
* Approval workflows
* Request and ticket status

## 2. Security Controls

### Employee validation

The backend validates that the supplied employee ID exists in the employee database before processing a request.

### Approval authorization

Approval requests contain an employee ID.

Before an approval decision is processed, the backend checks that the employee ID associated with the pending approval matches the employee ID supplied with the approval request.

This prevents an approval request for one employee from being processed using a different employee ID within the current application flow.

### Prompt-injection protection

Retrieved company-policy documents are checked for prompt-injection content before they are returned to the agent.

If a retrieved document contains detected prompt-injection content, it is excluded from the result.

### Sensitive information

WorkMate should not request or expose:

* Passwords
* Authentication codes
* API keys
* Other secrets

Employees should not provide sensitive credentials to the assistant.

### Approval gate

Actions that require human approval do not execute immediately.

The workflow pauses and waits for an approval decision before completing the action.

### Conversation deletion

Deleting a conversation removes its:

* Chat messages
* Conversation record
* Approval records

The associated LangGraph checkpoint threads are also deleted.

This prevents the deleted conversation from being recovered through the application's stored conversation history or LangGraph checkpoint memory.

## 3. Known Security Limitation

### No real authentication

The current capstone does not implement a real authentication system.

The frontend currently uses a temporary employee identity:

```text
EMP001
```

The backend validates this ID against the employee database, but the application does not currently prove that the person making the request is actually EMP001.

Therefore, the current employee ID check should be considered an application-level authorization check, not full user authentication.

A production deployment would require authenticated user identity, such as a company SSO or another trusted authentication mechanism, and the backend should obtain the employee identity from the authenticated session rather than trusting a value supplied by the client.

## 4. Other Production Considerations

For a production deployment, additional controls would be required, including:

* HTTPS
* Secure authentication
* Server-side authorization
* Proper secret management
* Rate limiting
* Audit logging
* Database access controls
* Input validation
* Security monitoring

These are outside the scope of this capstone implementation.

## 5. Security Test

The project includes an injection test that verifies that detected prompt-injection content from retrieved documents is blocked.

The approval workflow also verifies that an approval decision cannot be processed when the supplied employee ID does not match the employee associated with the pending approval.

## 6. Security Review Result

The current implementation identifies a real security limitation:

> Employee identity is supplied by the client and is not backed by real authentication.

The application reduces this risk with backend employee validation and approval ownership checks, but these controls do not replace authentication.

This limitation should be addressed before using WorkMate AI in a real production employee environment.
