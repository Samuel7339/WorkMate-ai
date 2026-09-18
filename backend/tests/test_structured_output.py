import pytest

from ai.models.model import structured_model
from ai.schemas.response import WorkMateResponse


def test_structured_output():
    response = structured_model.invoke(
        """
        An employee wants to check their casual leave balance.
        This is an HR request. No approval is needed and no human
        escalation is required.
        """
    )

    print(response)

    assert response.department == "hr"
    assert response.requires_approval is False
    assert response.requires_human is False


def test_invalid_structured_output():
    with pytest.raises(ValueError):
        WorkMateResponse(
            department="finance",
            intent="salary",
            confidence=1.5,
            requires_approval=False,
            requires_human=False,
            reason="Invalid test data.",
        )