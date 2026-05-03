from pydantic import BaseModel, ConfigDict, Field


class ExercicioCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=120)
    grupo: str = Field(..., min_length=1, max_length=80)
    categoria: str = Field(..., min_length=1, max_length=40)

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class FavoritoExercicioCreate(BaseModel):
    exercicio_id: str = Field(..., min_length=1)

    model_config = ConfigDict(extra="forbid")
