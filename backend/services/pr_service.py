from typing import Any, Mapping


TreinoRecord = Mapping[str, Any]


def _normalizar_exercicio(exercicio: Any) -> str | None:
    if not isinstance(exercicio, str):
        return None

    exercicio_normalizado = exercicio.strip()
    if not exercicio_normalizado:
        return None

    return exercicio_normalizado


def _converter_carga(carga: Any) -> float | None:
    if carga is None:
        return None

    try:
        return float(carga)
    except (TypeError, ValueError):
        return None


def calcular_recordes(treinos: list[TreinoRecord]) -> list[dict[str, Any]]:
    recordes_por_exercicio: dict[str, dict[str, Any]] = {}

    for treino in treinos:
        exercicio = _normalizar_exercicio(treino.get("exercicio"))
        carga = _converter_carga(treino.get("carga"))

        if exercicio is None or carga is None:
            continue

        chave_exercicio = exercicio.lower()
        recorde_atual = recordes_por_exercicio.get(chave_exercicio)

        if recorde_atual is None or carga > float(recorde_atual["carga"]):
            recordes_por_exercicio[chave_exercicio] = {
                "exercicio": exercicio,
                "carga": carga,
                "repeticoes": treino.get("repeticoes"),
                "data": treino.get("data"),
            }

    return sorted(
        recordes_por_exercicio.values(),
        key=lambda recorde: str(recorde["exercicio"]).lower(),
    )
