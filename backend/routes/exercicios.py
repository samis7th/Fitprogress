from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.exercicio_schema import ExercicioCreate, FavoritoExercicioCreate

router = APIRouter(prefix="/exercicios", tags=["Exercicios"])


@router.get("")
async def listar_exercicios(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = (
            supabase.table("exercicios")
            .select("*")
            .or_(f"criado_por.is.null,criado_por.eq.{current_user.id}")
            .order("grupo", desc=False)
            .order("nome", desc=False)
        )
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Exercicios listados com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar exercicios: {str(exc)}",
        ) from exc


@router.post("", status_code=status.HTTP_201_CREATED)
async def criar_exercicio(
    exercicio: ExercicioCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = exercicio.model_dump(mode="json")
        payload["criado_por"] = current_user.id

        response = await run_in_threadpool(
            lambda: supabase.table("exercicios").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Exercicio criado com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar exercicio: {str(exc)}",
        ) from exc


@router.get("/favoritos")
async def listar_favoritos_exercicios(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = supabase.table("favoritos_exercicios").select("id, exercicio_id")
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Favoritos listados com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar favoritos: {str(exc)}",
        ) from exc


@router.post("/favoritos", status_code=status.HTTP_201_CREATED)
async def favoritar_exercicio(
    favorito: FavoritoExercicioCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = favorito.model_dump(mode="json")
        payload["usuario_id"] = current_user.id

        response = await run_in_threadpool(
            lambda: supabase.table("favoritos_exercicios").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Exercicio favoritado com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao favoritar exercicio: {str(exc)}",
        ) from exc


@router.delete("/favoritos/{favorito_id}")
async def remover_favorito_exercicio(
    favorito_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("favoritos_exercicios").delete().eq("id", favorito_id).execute()
        )

        return {
            "success": True,
            "message": "Favorito removido com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover favorito: {str(exc)}",
        ) from exc
