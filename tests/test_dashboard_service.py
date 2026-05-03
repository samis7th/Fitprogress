from datetime import date, timedelta

from backend.services.dashboard_service import calcular_resumo_dashboard, contar_sessoes_treino


def test_contar_sessoes_treino_agrupa_por_sessao_id():
    treinos = [
        {"id": "1", "sessao_id": "sessao-a"},
        {"id": "2", "sessao_id": "sessao-a"},
        {"id": "3", "sessao_id": "sessao-b"},
        {"id": "4", "sessao_id": None},
    ]

    assert contar_sessoes_treino(treinos) == 3


def test_calcular_resumo_dashboard_consolida_metricas_pr_peso_e_metas():
    hoje = date.today()
    treinos = [
        {
            "id": "1",
            "sessao_id": "sessao-a",
            "exercicio": "Supino reto",
            "carga": 90,
            "repeticoes": 8,
            "data": hoje.isoformat(),
        },
        {
            "id": "2",
            "sessao_id": "sessao-a",
            "exercicio": "Remada baixa",
            "carga": 70,
            "repeticoes": 10,
            "data": hoje.isoformat(),
        },
        {
            "id": "3",
            "sessao_id": "sessao-antiga",
            "exercicio": "Supino reto",
            "carga": 80,
            "repeticoes": 10,
            "data": (hoje - timedelta(days=10)).isoformat(),
        },
    ]
    pesos = [{"peso": 80, "data": "2026-05-01"}, {"peso": 78.5, "data": "2026-05-03"}]
    metas = [
        {"exercicio": "Supino reto", "meta_carga": 90, "meta_repeticoes": 8, "concluida": False},
        {"exercicio": "Remada baixa", "meta_carga": 100, "concluida": False},
        {"exercicio": "Agachamento", "meta_carga": 120, "concluida": True},
    ]

    resumo = calcular_resumo_dashboard(treinos, pesos, metas)

    assert resumo["treinos_total"] == 3
    assert resumo["treinos_semana"] == 2
    assert resumo["treinos_concluidos_total"] == 2
    assert resumo["treinos_concluidos_semana"] == 1
    assert resumo["peso_atual"] == pesos[-1]
    assert resumo["peso_variacao"] == -1.5
    assert resumo["recordes_total"] == 2
    assert resumo["melhor_pr"]["exercicio"] == "Supino reto"
    assert resumo["metas_ativas"] == 1
    assert resumo["metas_concluidas"] == 2
