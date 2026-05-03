from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.dieta_schema import DietaCreate, DietaUpdate

router = APIRouter(prefix="/dieta", tags=["Dieta"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def registrar_dieta(
    dieta: DietaCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = dieta.model_dump(mode="json")
        payload["usuario_id"] = current_user.id

        response = await run_in_threadpool(
            lambda: supabase.table("dieta").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Dieta registrada com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao registrar dieta: {str(exc)}",
        ) from exc


@router.get("")
async def listar_dieta(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = (
            supabase.table("dieta")
            .select("*")
            .order("data", desc=True)
            .order("created_at", desc=True)
        )
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Dieta listada com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar dieta: {str(exc)}",
        ) from exc


@router.patch("/{dieta_id}")
async def atualizar_dieta(
    dieta_id: str,
    dieta: DietaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = dieta.model_dump(mode="json", exclude_unset=True)

        if not payload:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualizar")

        response = await run_in_threadpool(
            lambda: supabase.table("dieta").update(payload).eq("id", dieta_id).execute()
        )

        return {
            "success": True,
            "message": "Dieta atualizada com sucesso",
            "data": response.data,
        }
    except HTTPException:
        raise
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar dieta: {str(exc)}",
        ) from exc


@router.delete("/{dieta_id}")
async def deletar_dieta(
    dieta_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("dieta").delete().eq("id", dieta_id).execute()
        )

        return {
            "success": True,
            "message": "Dieta removida com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover dieta: {str(exc)}",
        ) from exc
