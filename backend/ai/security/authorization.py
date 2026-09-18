from ..schemas.user import User


def can_approve(
    user: User,
    action_department: str,
) -> bool:
    if user.role == "system_admin":
        return True

    if user.role != "reviewer":
        return False

    return user.department == action_department