from ai.schemas.response import WorkMateResponse
from ai.security.escalation import should_escalate


def test_high_confidence_response_does_not_escalate():
    response = WorkMateResponse(
        department="hr",
        intent="leave_balance",
        confidence=0.90,
        requires_approval=False,
        requires_human=False,
        reason="The request is clear.",
    )

    assert should_escalate(response) is False


def test_low_confidence_response_escalates():
    response = WorkMateResponse(
        department="hr",
        intent="unknown",
        confidence=0.40,
        requires_approval=False,
        requires_human=False,
        reason="The request is unclear.",
    )

    assert should_escalate(response) is True


def test_explicit_human_requirement_escalates():
    response = WorkMateResponse(
        department="hr",
        intent="sensitive_hr_issue",
        confidence=0.90,
        requires_approval=False,
        requires_human=True,
        reason="Human review is required.",
    )

    assert should_escalate(response) is True