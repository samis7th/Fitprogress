from pydantic import BaseModel, ConfigDict, Field


class MetaCreate(BaseModel):
    exercicio: str = Field(..., min_length=1, max_length=120)
    meta_carga: float = Field(..., gt=0)
    meta_repeticoes: int | None = Field(default=None, gt=0)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class MetaUpdate(BaseModel):
    exercicio: str | None = Field(default=None, min_length=1, max_length=120)
    meta_carga: float | None = Field(default=None, gt=0)
    meta_repeticoes: int | None = Field(default=None, gt=0)
    concluida: bool | None = None

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
