from __future__ import annotations

from database.queries import SupabaseRepository


def verificar_conexao() -> bool:
    try:
        SupabaseRepository().check_connection()
        return True
    except Exception:
        return False
