from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.meta_schema import MetaCreate, MetaUpdate

router = APIRouter(prefix="/metas", tags=["Metas"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def criar_meta(
    meta: MetaCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = meta.model_dump(mode="json")
        payload["usuario_id"] = current_user.id

        response = await run_in_threadpool(
            lambda: supabase.table("metas").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Meta criada com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar meta: {str(exc)}",
        ) from exc


@router.get("")
async def listar_metas(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = supabase.table("metas").select("*").order("exercicio", desc=False)
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Metas listadas com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar metas: {str(exc)}",
        ) from exc


@router.patch("/{meta_id}")
async def atualizar_meta(
    meta_id: str,
    meta: MetaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = meta.model_dump(mode="json", exclude_unset=True)

        if not payload:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualizar")

        if "concluida" in payload:
            payload["concluida_em"] = (
                datetime.now(timezone.utc).isoformat() if payload["concluida"] else None
            )

        response = await run_in_threadpool(
            lambda: supabase.table("metas").update(payload).eq("id", meta_id).execute()
        )

        return {
            "success": True,
            "message": "Meta atualizada com sucesso",
            "data": response.data,
        }
    except HTTPException:
        raise
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar meta: {str(exc)}",
        ) from exc


@router.delete("/{meta_id}")
async def deletar_meta(
    meta_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("metas").delete().eq("id", meta_id).execute()
        )

        return {
            "success": True,
            "message": "Meta removida com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover meta: {str(exc)}",
        ) from exc
