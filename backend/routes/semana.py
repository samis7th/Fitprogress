import unicodedata

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.concurrency import run_in_threadpool

from backend.auth import CurrentUser, get_current_user
from backend.db import SupabaseConfigError, get_authenticated_supabase_client
from backend.schemas.semana_schema import TreinoSemanaCreate, TreinoSemanaUpdate

router = APIRouter(prefix="/semana", tags=["Treino da Semana"])

ORDEM_DIAS_SEMANA = {
    "segunda": 1,
    "terca": 2,
    "terça": 2,
    "quarta": 3,
    "quinta": 4,
    "sexta": 5,
    "sabado": 6,
    "sábado": 6,
    "domingo": 7,
}


def ordenar_por_dia_semana(treinos: list[dict]) -> list[dict]:
    return sorted(
        treinos,
        key=lambda treino: (
            ORDEM_DIAS_SEMANA.get(str(treino.get("dia_semana", "")).strip().lower(), 99),
            str(treino.get("nome_treino", "")).lower(),
        ),
    )


def normalizar_dia_semana(dia_semana: str | None) -> str:
    texto = str(dia_semana or "").strip().lower()
    texto = unicodedata.normalize("NFD", texto)
    return "".join(char for char in texto if unicodedata.category(char) != "Mn")


def deduplicar_por_dia_semana(treinos: list[dict]) -> list[dict]:
    treinos_por_dia: dict[str, dict] = {}

    for treino in treinos:
        dia_normalizado = normalizar_dia_semana(treino.get("dia_semana"))
        if not dia_normalizado:
            continue

        treino_atual = treinos_por_dia.get(dia_normalizado)
        treino_created_at = str(treino.get("created_at") or "")
        atual_created_at = str(treino_atual.get("created_at") or "") if treino_atual else ""

        if treino_atual is None or treino_created_at > atual_created_at:
            treinos_por_dia[dia_normalizado] = treino

    return ordenar_por_dia_semana(list(treinos_por_dia.values()))


@router.post("", status_code=status.HTTP_201_CREATED)
async def criar_treino_semana(
    treino: TreinoSemanaCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = treino.model_dump(mode="json")
        payload["usuario_id"] = current_user.id
        dia_normalizado = normalizar_dia_semana(payload.get("dia_semana"))

        existentes_response = await run_in_threadpool(
            lambda: supabase.table("treino_semana")
            .select("id, dia_semana, created_at")
            .execute()
        )
        treinos_mesmo_dia = [
            item
            for item in existentes_response.data or []
            if normalizar_dia_semana(item.get("dia_semana")) == dia_normalizado
        ]

        if treinos_mesmo_dia:
            treinos_mesmo_dia = sorted(
                treinos_mesmo_dia,
                key=lambda item: str(item.get("created_at") or ""),
                reverse=True,
            )
            treino_principal = treinos_mesmo_dia[0]
            response = await run_in_threadpool(
                lambda: supabase.table("treino_semana")
                .update(payload)
                .eq("id", treino_principal["id"])
                .execute()
            )

            ids_duplicados = [item["id"] for item in treinos_mesmo_dia[1:] if item.get("id")]
            if ids_duplicados:
                await run_in_threadpool(
                    lambda: supabase.table("treino_semana")
                    .delete()
                    .in_("id", ids_duplicados)
                    .execute()
                )

            return {
                "success": True,
                "message": "Treino da semana atualizado com sucesso",
                "data": response.data,
            }

        response = await run_in_threadpool(
            lambda: supabase.table("treino_semana").insert(payload).execute()
        )

        return {
            "success": True,
            "message": "Treino da semana criado com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar treino da semana: {str(exc)}",
        ) from exc


@router.get("")
async def listar_treino_semana(
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        query = supabase.table("treino_semana").select("*")
        response = await run_in_threadpool(query.execute)

        return {
            "success": True,
            "message": "Treinos da semana listados com sucesso",
            "data": deduplicar_por_dia_semana(response.data or []),
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar treino da semana: {str(exc)}",
        ) from exc


@router.patch("/{treino_semana_id}")
async def atualizar_treino_semana(
    treino_semana_id: str,
    treino: TreinoSemanaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        payload = treino.model_dump(mode="json", exclude_unset=True)

        if not payload:
            raise HTTPException(status_code=400, detail="Nenhum campo enviado para atualizar")

        response = await run_in_threadpool(
            lambda: supabase.table("treino_semana").update(payload).eq("id", treino_semana_id).execute()
        )

        return {
            "success": True,
            "message": "Treino da semana atualizado com sucesso",
            "data": response.data,
        }
    except HTTPException:
        raise
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao atualizar treino da semana: {str(exc)}",
        ) from exc


@router.delete("/{treino_semana_id}")
async def deletar_treino_semana(
    treino_semana_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    try:
        supabase = get_authenticated_supabase_client(current_user.access_token)
        response = await run_in_threadpool(
            lambda: supabase.table("treino_semana").delete().eq("id", treino_semana_id).execute()
        )

        return {
            "success": True,
            "message": "Treino da semana removido com sucesso",
            "data": response.data,
        }
    except SupabaseConfigError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao remover treino da semana: {str(exc)}",
        ) from exc
