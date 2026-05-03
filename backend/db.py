import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


class SupabaseConfigError(RuntimeError):
    """Erro de configuracao do cliente Supabase."""


def _get_supabase_credentials() -> tuple[str, str]:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise SupabaseConfigError(
            "SUPABASE_URL e SUPABASE_KEY devem estar configuradas no .env"
        )

    return supabase_url, supabase_key


@lru_cache
def get_supabase_client() -> Client:
    supabase_url, supabase_key = _get_supabase_credentials()
    return create_client(supabase_url, supabase_key)


def get_authenticated_supabase_client(access_token: str) -> Client:
    supabase_url, supabase_key = _get_supabase_credentials()
    client = create_client(supabase_url, supabase_key)
    client.postgrest.auth(access_token)
    return client
