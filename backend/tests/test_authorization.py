from ai.schemas.user import User
from ai.security.authorization import can_approve


def test_employee_cannot_approve():
    user = User(
        user_id="EMP001",
        name="Samuel",
        role="employee",
        department="hr",
    )

    assert can_approve(user, "hr") is False


def test_reviewer_can_approve_same_department():
    user = User(
        user_id="IT001",
        name="IT Reviewer",
        role="reviewer",
        department="it",
    )

    assert can_approve(user, "it") is True


def test_reviewer_cannot_approve_other_department():
    user = User(
        user_id="IT001",
        name="IT Reviewer",
        role="reviewer",
        department="it",
    )

    assert can_approve(user, "hr") is False


def test_admin_can_approve_any_department():
    user = User(
        user_id="ADMIN001",
        name="Admin",
        role="system_admin",
        department="hr",
    )

    assert can_approve(user, "it") is True
    assert can_approve(user, "facilities") is True