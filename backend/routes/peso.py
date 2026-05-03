from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.peso_schema import PesoCreate, PesoUpdate

router = APIRouter(prefix="/peso", tags=["Peso"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def registrar_peso(
    peso: PesoCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = peso.model_dump(mode="json")
        payload["usuario_id"] = current_user.id

        response = await run_in_threadpool(
            lambda: supabase.table("peso").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Peso registrado com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao registrar peso: {str(exc)}",
        ) from exc


@router.get("")
async def listar_evolucao_peso(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = supabase.table("peso").select("*").order("data", desc=False)
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Evolucao de peso listada com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar evolucao de peso: {str(exc)}",
        ) from exc


@router.patch("/{peso_id}")
async def atualizar_peso(
    peso_id: str,
    peso: PesoUpdate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = peso.model_dump(mode="json", exclude_unset=True)

        if not payload:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualizar")

        response = await run_in_threadpool(
            lambda: supabase.table("peso").update(payload).eq("id", peso_id).execute()
        )

        return {
            "success": True,
            "message": "Peso atualizado com sucesso",
            "data": response.data,
        }
    except HTTPException:
        raise
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar peso: {str(exc)}",
        ) from exc


@router.delete("/{peso_id}")
async def deletar_peso(
    peso_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("peso").delete().eq("id", peso_id).execute()
        )

        return {
            "success": True,
            "message": "Peso removido com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover peso: {str(exc)}",
        ) from exc
