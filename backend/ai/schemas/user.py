from typing import Literal

from pydantic import BaseModel


Role = Literal["employee", "reviewer", "system_admin"]

Department = Literal["hr", "it", "facilities"]


class User(BaseModel):
    user_id: str
    name: str
    role: Role
    department: Department