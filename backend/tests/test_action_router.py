from ai.agents.action_router import route_action
from ai.schemas.response import WorkMateResponse


def make_response(
    confidence=1.0,
    requires_approval=False,
    requires_human=False,
):
    return WorkMateResponse(
        department="hr",
        intent="test",
        confidence=confidence,
        requires_approval=requires_approval,
        requires_human=requires_human,
        reason="Test response",
    )


def test_normal_request_is_complete():
    response = make_response()

    assert route_action(response) == "complete"


def test_approval_request_goes_to_approval():
    response = make_response(
        requires_approval=True,
    )

    assert route_action(response) == "approval"


def test_explicit_human_request_goes_to_escalation():
    response = make_response(
        requires_human=True,
    )

    assert route_action(response) == "escalate"


def test_low_confidence_goes_to_escalation():
    response = make_response(
        confidence=0.40,
    )

    assert route_action(response) == "escalate"


def test_human_takes_priority_over_approval():
    response = make_response(
        confidence=0.95,
        requires_approval=True,
        requires_human=True,
    )

    assert route_action(response) == "escalate"