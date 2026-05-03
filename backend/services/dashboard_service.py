from datetime import date, datetime, timedelta
from typing import Any

from backend.services.pr_service import calcular_recordes


def _parse_date(value: Any) -> date | None:
    if isinstance(value, date):
        return value

    if not isinstance(value, str):
        return None

    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def contar_sessoes_treino(treinos: list[dict[str, Any]]) -> int:
    sessoes: set[str] = set()

    for treino in treinos:
        identificador = treino.get("sessao_id") or treino.get("id")
        if identificador:
            sessoes.add(str(identificador))

    return len(sessoes)


def _to_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def _to_int(value: Any) -> int:
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def _meta_atingida_automaticamente(meta: dict[str, Any], recordes_por_exercicio: dict[str, dict[str, Any]]) -> bool:
    exercicio = str(meta.get("exercicio") or "").strip().lower()
    if not exercicio:
        return False

    recorde = recordes_por_exercicio.get(exercicio)
    if not recorde:
        return False

    meta_carga = _to_float(meta.get("meta_carga"))
    meta_repeticoes = _to_int(meta.get("meta_repeticoes"))
    carga_atual = _to_float(recorde.get("carga"))
    repeticoes_atuais = _to_int(recorde.get("repeticoes"))

    if meta_carga <= 0 or carga_atual < meta_carga:
        return False

    return not meta_repeticoes or repeticoes_atuais >= meta_repeticoes


def calcular_resumo_dashboard(
    treinos: list[dict[str, Any]],
    pesos: list[dict[str, Any]],
    metas: list[dict[str, Any]],
) -> dict[str, Any]:
    hoje = date.today()
    inicio_semana = hoje - timedelta(days=6)
    recordes = calcular_recordes(treinos)
    recordes_por_exercicio = {
        str(recorde.get("exercicio") or "").strip().lower(): recorde
        for recorde in recordes
        if recorde.get("exercicio")
    }
    melhor_pr = max(recordes, key=lambda pr: float(pr.get("carga") or 0), default=None)

    treinos_semana = [
        treino
        for treino in treinos
        if (data_treino := _parse_date(treino.get("data"))) and data_treino >= inicio_semana
    ]

    peso_atual = pesos[-1] if pesos else None
    peso_anterior = pesos[-2] if len(pesos) > 1 else None
    peso_variacao = None

    if peso_atual and peso_anterior:
        try:
            peso_variacao = float(peso_atual.get("peso")) - float(peso_anterior.get("peso"))
        except (TypeError, ValueError):
            peso_variacao = None

    metas_ativas = [
        meta
        for meta in metas
        if not meta.get("concluida") and not _meta_atingida_automaticamente(meta, recordes_por_exercicio)
    ]

    return {
        "treinos_total": len(treinos),
        "treinos_semana": len(treinos_semana),
        "treinos_concluidos_total": contar_sessoes_treino(treinos),
        "treinos_concluidos_semana": contar_sessoes_treino(treinos_semana),
        "peso_atual": peso_atual,
        "peso_variacao": peso_variacao,
        "metas_ativas": len(metas_ativas),
        "metas_concluidas": len(metas) - len(metas_ativas),
        "recordes_total": len(recordes),
        "melhor_pr": melhor_pr,
    }
