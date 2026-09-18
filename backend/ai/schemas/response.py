from typing import Literal

from pydantic import BaseModel, Field


class WorkMateResponse(BaseModel):
    department: Literal["hr", "it", "facilities", "unknown"]

    intent: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    requires_approval: bool

    requires_human: bool

    reason: str