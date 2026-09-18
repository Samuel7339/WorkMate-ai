from ..schemas.response import WorkMateResponse


ESCALATION_CONFIDENCE_THRESHOLD = 0.70


def should_escalate(response: WorkMateResponse) -> bool:
    if response.requires_human:
        return True

    if response.confidence < ESCALATION_CONFIDENCE_THRESHOLD:
        return True

    return False