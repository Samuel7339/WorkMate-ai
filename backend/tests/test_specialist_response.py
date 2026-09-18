from ai.agents.specialist_result import build_specialist_response
from ai.schemas.response import WorkMateResponse


def test_build_specialist_response():
    structured_response = WorkMateResponse(
        department="facilities",
        intent="check_maintenance_status",
        confidence=1.0,
        requires_approval=False,
        requires_human=False,
        reason="Maintenance ticket status was retrieved.",
    )

    result = {
        "structured_response": structured_response,
        "messages": [],
    }

    response = build_specialist_response(result)

    assert response.response.department == "facilities"
    assert response.response.intent == "check_maintenance_status"
    assert response.answer == ""
    assert response.tool_result is None