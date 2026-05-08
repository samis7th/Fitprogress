from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.treino_schema import TreinoCreate, TreinoSessaoCreate, TreinoUpdate
from backend.services.pr_service import calcular_recordes

router = APIRouter(prefix="/treinos", tags=["Treinos"])


def _erro_coluna_opcional_inexistente(exc: Exception, coluna: str) -> bool:
    mensagem = str(exc).lower()
    return coluna in mensagem and ("does not exist" in mensagem or "schema cache" in mensagem)


def _remover_campo(payload, campo: str):
    if isinstance(payload, list):
        return [{key: value for key, value in item.items() if key != campo} for item in payload]

    return {key: value for key, value in payload.items() if key != campo}


def _insert_treinos(supabase, payload):
    try:
        return supabase.table("treinos").insert(payload).execute()
    except Exception as exc:
        if _erro_coluna_opcional_inexistente(exc, "observacao"):
            return _insert_treinos(supabase, _remover_campo(payload, "observacao"))
        if _erro_coluna_opcional_inexistente(exc, "duracao_segundos"):
            return _insert_treinos(supabase, _remover_campo(payload, "duracao_segundos"))
        raise


@router.post("", status_code=status.HTTP_201_CREATED)
async def criar_treino(
    treino: TreinoCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = treino.model_dump(mode="json")
        payload["usuario_id"] = current_user.id

        response = await run_in_threadpool(lambda: _insert_treinos(supabase, payload))

        return {
            "success": True,
            "message": "Treino criado com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar treino: {str(exc)}",
        ) from exc


@router.get("")
async def listar_treinos(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = (
            supabase.table("treinos")
            .select("*")
            .order("data", desc=True)
            .order("created_at", desc=True)
        )
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Treinos listados com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar treinos: {str(exc)}",
        ) from exc


@router.post("/sessao", status_code=status.HTTP_201_CREATED)
async def criar_sessao_treino(
    sessao: TreinoSessaoCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = sessao.to_insert_payloads(current_user.id)

        response = await run_in_threadpool(lambda: _insert_treinos(supabase, payload))

        return {
            "success": True,
            "message": "Sessao de treino criada com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar sessao de treino: {str(exc)}",
        ) from exc


@router.get("/sessoes")
async def listar_sessoes_treino(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = (
            supabase.table("treinos")
            .select("*")
            .order("data", desc=True)
            .order("created_at", desc=True)
        )
        response = await run_in_threadpool(query.execute)

        sessoes: dict[str, dict] = {}

        for treino in response.data or []:
            sessao_id = treino.get("sessao_id") or treino.get("id")
            sessao = sessoes.setdefault(
                sessao_id,
                {
                    "sessao_id": sessao_id,
                    "nome_treino": treino.get("nome_treino") or "Treino avulso",
                    "data": treino.get("data"),
                    "exercicios": [],
                },
            )
            sessao["exercicios"].append(treino)

        return {
            "success": True,
            "message": "Sessoes de treino listadas com sucesso",
            "data": list(sessoes.values()),
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar sessoes de treino: {str(exc)}",
        ) from exc


@router.get("/pr")
async def listar_recordes_treinos(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = supabase.table("treinos").select(
            "id, exercicio, carga, repeticoes, series, data, created_at"
        )
        response = await run_in_threadpool(query.execute)
        recordes = calcular_recordes(response.data or [])

        return {
            "success": True,
            "message": "Recordes calculados com sucesso",
            "data": recordes,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao calcular recordes: {str(exc)}",
        ) from exc


@router.patch("/{treino_id}")
async def atualizar_treino(
    treino_id: str,
    treino: TreinoUpdate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = treino.model_dump(mode="json", exclude_unset=True)

        if not payload:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualizar")

        response = await run_in_threadpool(
            lambda: supabase.table("treinos").update(payload).eq("id", treino_id).execute()
        )

        return {
            "success": True,
            "message": "Treino atualizado com sucesso",
            "data": response.data,
        }
    except HTTPException:
        raise
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar treino: {str(exc)}",
        ) from exc


@router.delete("/{treino_id}")
async def deletar_treino(
    treino_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("treinos").delete().eq("id", treino_id).execute()
        )

        return {
            "success": True,
            "message": "Treino removido com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover treino: {str(exc)}",
        ) from exc
