from fastapi import APIRouter, Depends, HTTPException
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.services.dashboard_service import calcular_resumo_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
async def obter_resumo_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)

        treinos_query = supabase.table("treinos").select("*").order("data", desc=False)
        peso_query = supabase.table("peso").select("*").order("data", desc=False)
        metas_query = supabase.table("metas").select("*").order("exercicio", desc=False)

        treinos_response, peso_response, metas_response = await run_in_threadpool(
            lambda: (
                treinos_query.execute(),
                peso_query.execute(),
                metas_query.execute(),
            )
        )

        resumo = calcular_resumo_dashboard(
            treinos_response.data or [],
            peso_response.data or [],
            metas_response.data or [],
        )

        return {
            "success": True,
            "message": "Resumo carregado com sucesso",
            "data": resumo,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao carregar resumo do dashboard: {str(exc)}",
        ) from exc
