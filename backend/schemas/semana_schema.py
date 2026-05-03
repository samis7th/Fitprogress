from pydantic import BaseModel, ConfigDict, Field


class ExercicioPlanejado(BaseModel):
    exercicio: str = Field(..., min_length=1, max_length=120)
    grupo: str | None = Field(default=None, min_length=1, max_length=80)
    categoria: str | None = Field(default=None, min_length=1, max_length=40)
    series: int = Field(..., gt=0)
    repeticoes: int = Field(..., gt=0)
    carga_alvo: float | None = Field(default=None, gt=0)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class TreinoSemanaCreate(BaseModel):
    dia_semana: str = Field(..., min_length=1, max_length=20)
    nome_treino: str = Field(..., min_length=1, max_length=120)
    exercicios: list[ExercicioPlanejado] = Field(..., min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class TreinoSemanaUpdate(BaseModel):
    dia_semana: str | None = Field(default=None, min_length=1, max_length=20)
    nome_treino: str | None = Field(default=None, min_length=1, max_length=120)
    exercicios: list[ExercicioPlanejado] | None = Field(default=None, min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
