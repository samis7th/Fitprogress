from datetime import date
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class TreinoCreate(BaseModel):
    exercicio: str = Field(..., min_length=1, max_length=120)
    grupo: str | None = Field(default=None, min_length=1, max_length=80)
    categoria: str | None = Field(default=None, min_length=1, max_length=40)
    series: int | None = Field(default=None, ge=1, le=10)
    carga: float = Field(..., gt=0)
    repeticoes: int = Field(..., gt=0)
    data: date = Field(default_factory=date.today)
    nome_treino: str | None = Field(default=None, min_length=1, max_length=120)
    observacao: str | None = Field(default=None, max_length=500)
    duracao_segundos: int | None = Field(default=None, ge=0)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class TreinoUpdate(BaseModel):
    exercicio: str | None = Field(default=None, min_length=1, max_length=120)
    grupo: str | None = Field(default=None, min_length=1, max_length=80)
    categoria: str | None = Field(default=None, min_length=1, max_length=40)
    series: int | None = Field(default=None, ge=1, le=10)
    carga: float | None = Field(default=None, gt=0)
    repeticoes: int | None = Field(default=None, gt=0)
    data: date | None = None
    nome_treino: str | None = Field(default=None, min_length=1, max_length=120)
    observacao: str | None = Field(default=None, max_length=500)
    duracao_segundos: int | None = Field(default=None, ge=0)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class TreinoSessaoExercicio(BaseModel):
    exercicio: str = Field(..., min_length=1, max_length=120)
    grupo: str | None = Field(default=None, min_length=1, max_length=80)
    categoria: str | None = Field(default=None, min_length=1, max_length=40)
    series: int | None = Field(default=None, ge=1, le=10)
    carga: float = Field(..., gt=0)
    repeticoes: int = Field(..., gt=0)
    observacao: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class TreinoSessaoCreate(BaseModel):
    nome_treino: str = Field(..., min_length=1, max_length=120)
    data: date = Field(default_factory=date.today)
    duracao_segundos: int | None = Field(default=None, ge=0)
    exercicios: list[TreinoSessaoExercicio] = Field(..., min_length=1)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    def to_insert_payloads(self, usuario_id: str) -> list[dict]:
        sessao_id = str(uuid4())

        return [
            {
                "usuario_id": usuario_id,
                "sessao_id": sessao_id,
                "nome_treino": self.nome_treino,
                "data": self.data.isoformat(),
                "duracao_segundos": self.duracao_segundos,
                **exercicio.model_dump(mode="json"),
            }
            for exercicio in self.exercicios
        ]
