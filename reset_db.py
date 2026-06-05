"""Script para limpar/resetar toda a base de dados do DevFlow.

Uso:
    python reset_db.py            # Modo interativo (pede confirmacao)
    python reset_db.py --force    # Requer DEVFLOW_ALLOW_DB_RESET=sim
    python reset_db.py --sql      # Exibe SQL para executar no Supabase Editor
"""

from __future__ import annotations

import sys
from os import getenv


RESET_ENV_VAR = "DEVFLOW_ALLOW_DB_RESET"


def mostrar_sql() -> None:
    from database.queries import SupabaseRepository
    repo = SupabaseRepository()
    sql = repo.reset_database_sql()
    print("Copie e execute o SQL abaixo no Supabase SQL Editor:")
    print()
    print(sql)


def main() -> None:
    from database.connection import get_client
    from database.queries import SupabaseRepository

    force = "--force" in sys.argv
    if force and getenv(RESET_ENV_VAR) != "sim":
        print(f"Para usar --force, defina {RESET_ENV_VAR}=sim no ambiente.")
        print("Isto evita apagar a base por acidente em scripts ou terminais errados.")
        raise SystemExit(2)

    if not force:
        resposta = input("Tem certeza que deseja LIMPAR TODOS OS DADOS? (s/N): ").strip().lower()
        if resposta != "s":
            print("Operacao cancelada.")
            return

    client = get_client()
    repo = SupabaseRepository(client)

    try:
        print("A apagar dados da base...")
        repo.reset_database(confirm=True)
        
        # Validar que a base foi limpa
        from database.queries import SupabaseRepository as Repo
        temp_repo = Repo(client)
        snapshot = temp_repo.load_snapshot()
        
        total_records = (
            len(snapshot.clientes) + 
            len(snapshot.projetos) + 
            len(snapshot.gastos) + 
            len(snapshot.receitas) + 
            len(snapshot.investimentos) + 
            len(snapshot.aportes) + 
            len(snapshot.pagamentos) +
            len(snapshot.tempo_projeto)
        )
        
        if total_records > 0:
            print(f"AVISO: Base nao foi completamente limpa! Encontrados {total_records} registos.")
            print("Tenta usar: python reset_db.py --sql")
            raise SystemExit(1)
        
        print("✓ Base de dados limpa com sucesso!")
        print("  - Todos os clientes, projetos, gastos, receitas, investimentos, etc. foram removidos.")
        print()
        print("IMPORTANTE: Se estiveres a usar a aplicacao web,")
        print("  → Recarrega a pagina (F5 ou Ctrl+R) para ver as mudancas!")
        print("  → A aplicacao vai detectar as mudancas em segundos.")
    except Exception as exc:
        print(f"Erro ao limpar base de dados: {exc}")
        print()
        print("Se o erro for de permissao (RLS), use o SQL alternativo:")
        print("  python reset_db.py --sql")
        raise SystemExit(1)


if __name__ == "__main__":
    if "--sql" in sys.argv:
        mostrar_sql()
    else:
        main()
