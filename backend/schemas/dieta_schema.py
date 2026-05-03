from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class DietaCreate(BaseModel):
    calorias: int = Field(..., gt=0)
    proteina: int = Field(..., ge=0)
    refeicao: str = Field(..., min_length=1, max_length=40)
    descricao: str | None = Field(default=None, max_length=500)
    data: date = Field(default_factory=date.today)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class DietaUpdate(BaseModel):
    calorias: int | None = Field(default=None, gt=0)
    proteina: int | None = Field(default=None, ge=0)
    refeicao: str | None = Field(default=None, min_length=1, max_length=40)
    descricao: str | None = Field(default=None, max_length=500)
    data: date | None = None

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
