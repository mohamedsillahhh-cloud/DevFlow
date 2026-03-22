from __future__ import annotations

import sys

from PyQt6.QtWidgets import QApplication, QMessageBox
from postgrest.exceptions import APIError

from database.queries import SupabaseRepository
from ui.dialogs import WelcomeDialog
from ui.main_window import MainWindow
from ui.theme import APP_STYLESHEET, DEFAULT_CONFIG
from utils.conexao import verificar_conexao


def carregar_configuracoes(repository: SupabaseRepository) -> dict[str, str]:
    registros = repository.load_configuracoes()
    return {**DEFAULT_CONFIG, **registros}


def salvar_configuracoes(
    repository: SupabaseRepository, valores: dict[str, str]
) -> dict[str, str]:
    merged_values = {**DEFAULT_CONFIG, **valores}
    return repository.save_configuracoes(merged_values)


def precisa_configuracao_inicial(configuracoes: dict[str, str]) -> bool:
    return not configuracoes.get("nome_usuario") or not configuracoes.get("caminho_backup")


def mostrar_erro_conexao() -> None:
    msg = QMessageBox()
    msg.setWindowTitle("Sem conexao")
    msg.setText(
        "Nao foi possivel conectar ao Supabase.\n"
        "Verifique a internet e confirme SUPABASE_URL e SUPABASE_KEY."
    )
    msg.setIcon(QMessageBox.Icon.Warning)
    msg.exec()


def mostrar_erro_supabase(exc: Exception, operacao: str) -> None:
    msg = QMessageBox()
    msg.setIcon(QMessageBox.Icon.Critical)

    if isinstance(exc, APIError) and exc.code == "42501":
        msg.setWindowTitle("Permissao negada no Supabase")
        msg.setText(
            "O Supabase bloqueou a escrita por causa de RLS.\n"
            "Execute o ficheiro database/supabase_policies.sql no SQL Editor."
        )
        msg.setInformativeText(
            f"A operacao de {operacao} foi recusada para a tabela configuracoes."
        )
        msg.setDetailedText(str(exc))
    else:
        msg.setWindowTitle("Erro no Supabase")
        msg.setText(f"Falha ao {operacao}.")
        msg.setInformativeText(str(exc))
    msg.exec()


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("DevFlow")
    app.setStyleSheet(APP_STYLESHEET)

    if not verificar_conexao():
        mostrar_erro_conexao()
        return 1

    repository = SupabaseRepository()
    try:
        configuracoes = carregar_configuracoes(repository)
    except Exception as exc:
        mostrar_erro_supabase(exc, "carregar as configuracoes")
        return 1

    if precisa_configuracao_inicial(configuracoes):
        dialog = WelcomeDialog()
        if dialog.exec() == 0:
            return 0
        try:
            configuracoes = salvar_configuracoes(repository, dialog.values())
        except Exception as exc:
            mostrar_erro_supabase(exc, "guardar as configuracoes iniciais")
            return 1

    window = MainWindow(repository=repository, configuracoes=configuracoes)
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
