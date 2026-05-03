from backend.services.pr_service import calcular_recordes


def test_calcular_recordes_retorna_maior_carga_por_exercicio():
    treinos = [
        {"exercicio": "Supino reto", "carga": 60, "repeticoes": 10, "data": "2026-05-01"},
        {"exercicio": "supino reto", "carga": 80, "repeticoes": 6, "data": "2026-05-02"},
        {"exercicio": "Remada baixa", "carga": "70.5", "repeticoes": 8, "data": "2026-05-03"},
    ]

    recordes = calcular_recordes(treinos)

    assert recordes == [
        {
            "exercicio": "Remada baixa",
            "carga": 70.5,
            "repeticoes": 8,
            "data": "2026-05-03",
            "usuario_id": None,
        },
        {
            "exercicio": "supino reto",
            "carga": 80.0,
            "repeticoes": 6,
            "data": "2026-05-02",
            "usuario_id": None,
        },
    ]


def test_calcular_recordes_ignora_dados_invalidos():
    treinos = [
        {"exercicio": "", "carga": 100},
        {"exercicio": None, "carga": 100},
        {"exercicio": "Agachamento", "carga": None},
        {"exercicio": "Agachamento", "carga": "abc"},
    ]

    assert calcular_recordes(treinos) == []
