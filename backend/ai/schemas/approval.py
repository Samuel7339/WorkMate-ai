from typing import TypedDict


from typing import TypedDict


class ApprovalState(TypedDict, total=False):
    employee_id: str
    department: str
    action: str
    description: str
    approved: bool
    action_result: dict

    requires_human: bool
    escalation_reason: str