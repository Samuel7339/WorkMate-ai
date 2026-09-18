from ..schemas.user import User
from .authorization import can_approve


def validate_approval(
    user: User,
    action_department: str,
) -> bool:
    return can_approve(
        user,
        action_department,
    )