from typing import Any
from pydantic import BaseModel
from pydantic import BaseModel, Field

from .response import WorkMateResponse


class SpecialistResponse(BaseModel):
    response: WorkMateResponse
    answer: str
    tool_result: Any | None = None
    sources: list[dict] = Field(default_factory=list)