from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Final

from dotenv import load_dotenv
from supabase import Client, create_client


def _runtime_root() -> Path:
    if getattr(sys, "frozen", False):
        executable_hint = sys.argv[0] or sys.executable
        return Path(executable_hint).resolve().parent
    return Path(__file__).resolve().parent.parent


PROJECT_ROOT: Final[Path] = _runtime_root()


def _load_environment() -> None:
    candidates = (
        PROJECT_ROOT / ".env",
        Path.cwd() / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    )
    for candidate in candidates:
        if candidate.exists():
            load_dotenv(candidate, override=False)
            break
    else:
        load_dotenv(override=False)


_load_environment()

SUPABASE_URL: Final[str | None] = os.getenv("SUPABASE_URL")
SUPABASE_KEY: Final[str | None] = os.getenv("SUPABASE_KEY")

_client: Client | None = None


def get_client() -> Client:
    global _client

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "Credenciais do Supabase ausentes. Defina SUPABASE_URL e SUPABASE_KEY no .env ou nas variaveis de ambiente."
        )

    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client
