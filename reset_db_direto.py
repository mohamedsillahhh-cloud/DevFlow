"""Reseta a base de dados via REST API direta (sem dependencia do pacote supabase)."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from dotenv import load_dotenv


def _load_env() -> None:
    candidates = (
        Path(__file__).resolve().parent / ".env",
        Path.cwd() / ".env",
    )
    for candidate in candidates:
        if candidate.exists():
            load_dotenv(candidate, override=False)
            return
    load_dotenv(override=False)


def _delete_tabela(url: str, headers: dict, tabela: str) -> None:
    req = Request(
        f"{url}/rest/v1/{tabela}?id=neq.0",
        method="DELETE",
        headers=headers,
    )
    with urlopen(req) as resp:
        if resp.status not in (200, 204):
            print(f"  {tabela}: HTTP {resp.status}")
        else:
            print(f"  {tabela}: OK")


def _apagar_chat(url: str, headers: dict) -> None:
    req = Request(
        f"{url}/rest/v1/configuracoes?chave=eq.chat_history",
        method="DELETE",
        headers=headers,
    )
    with urlopen(req):
        pass
    print("  configuracoes (chat): OK")


TABELAS = [
    "pagamentos",
    "receitas",
    "tempo_projeto",
    "aportes",
    "projetos",
    "investimentos",
    "gastos",
    "clientes",
]


def main() -> None:
    _load_env()

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("ERRO: SUPABASE_URL e SUPABASE_KEY devem estar no .env")
        sys.exit(1)

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    print("A limpar base de dados...")
    for tabela in TABELAS:
        try:
            _delete_tabela(url, headers, tabela)
        except HTTPError as e:
            print(f"  {tabela}: ERRO {e.code} — {e.reason}")
            if e.code == 401:
                print("\nA chave SUPABASE_KEY parece invalida para DELETE.")
                print("Tente usar a chave anon (VITE_SUPABASE_ANON_KEY) ou a service_role key.")
                sys.exit(1)
        except Exception as e:
            print(f"  {tabela}: ERRO — {e}")

    try:
        _apagar_chat(url, headers)
    except Exception:
        pass

    print("\nBase limpa com sucesso!")
    print("  - Todos os clientes, projetos, gastos, receitas, investimentos, etc. foram removidos.")


if __name__ == "__main__":
    main()
