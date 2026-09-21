from ..schemas.response import WorkMateResponse


def route_action(response: WorkMateResponse) -> str:
    """
    Determine the next application workflow
    after a specialist responds.
    """

    if response.requires_approval:
        return "approval"

    if response.requires_human:
        return "escalate"

    if response.confidence < 0.70:
        return "escalate"

    return "complete"

