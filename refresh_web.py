#!/usr/bin/env python3
"""Script para sincronizar a aplicacao web com a base de dados resetada.

Uso:
    python refresh_web.py    # Mostra instrucoes para recarregar

Este script fornece instrucoes para recarregar os dados da aplicacao web
apos resetar a base de dados.
"""

from __future__ import annotations

import json


def print_instructions() -> None:
    """Imprime instrucoes para recarregar a aplicacao web."""
    print()
    print("=" * 70)
    print("INSTRUCOES PARA SINCRONIZAR A APLICACAO WEB")
    print("=" * 70)
    print()
    print("Opcao 1: RECARREGAR A PAGINA (recomendado)")
    print("-" * 70)
    print("  → Recarrega a pagina no navegador (F5 ou Ctrl+R)")
    print("  → A aplicacao vai detectar os dados vazios e sincronizar")
    print()
    print("Opcao 2: USAR DEVTOOLS NO NAVEGADOR")
    print("-" * 70)
    print("  1. Abre a DevTools (F12 ou Ctrl+Shift+I)")
    print("  2. Va para a aba Console")
    print("  3. Cole o seguinte codigo e pressiona Enter:")
    print()
    
    js_code = "window.location.reload(true)"
    print(f'    {js_code}')
    print()
    print("Opcao 3: LIMPAR CACHE MANUALMENTE (se necessario)")
    print("-" * 70)
    print("  1. Abre DevTools (F12)")
    print("  2. Va para Application → Local Storage")
    print("  3. Procura por chaves que comecam com 'devflow-' ou 'supabase-'")
    print("  4. Deleta as chaves suspeitas")
    print("  5. Recarrega a pagina (F5)")
    print()
    print("=" * 70)
    print()
    print("ℹ️  DICA: A aplicacao tem sincronizacao em tempo real ativa.")
    print("Se resetaste os dados e nao aparece a mudanca, provavelmente eh")
    print("por causa de:")
    print("  • Cache do navegador (limpa com Ctrl+Shift+Del)")
    print("  • Sessao antiga do Supabase (recarrega a pagina)")
    print("  • Realtime nao foi acionado (espera 15 segundos e tenta novamente)")
    print()


def main() -> None:
    """Mostra instrucoes para recarregar a aplicacao web."""
    print_instructions()


if __name__ == "__main__":
    main()
