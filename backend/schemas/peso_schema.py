from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class PesoCreate(BaseModel):
    peso: float = Field(..., gt=0)
    data: date = Field(default_factory=date.today)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class PesoUpdate(BaseModel):
    peso: float | None = Field(default=None, gt=0)
    data: date | None = None

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
