from __future__ import annotations

from pathlib import Path

from PyQt6.QtWidgets import (
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFileDialog,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from .theme import MOEDA_OPCOES


class WelcomeDialog(QDialog):
    """Dialogo inicial com configuracao minima da aplicacao."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Primeira configuracao")
        self.setMinimumWidth(360)
        self.setMaximumWidth(420)

        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Seu nome no app")

        self.currency_input = QComboBox()
        for label, code in MOEDA_OPCOES:
            self.currency_input.addItem(label, code)
        self.currency_input.setCurrentIndex(0)

        self.backup_path_input = QLineEdit(str(Path.home() / "DevFlowBackups"))
        self.backup_path_input.setPlaceholderText("Pasta onde os backups serao guardados")

        browse_button = QPushButton("Escolher")
        browse_button.setObjectName("secondaryButton")
        browse_button.clicked.connect(self.choose_backup_folder)

        backup_row = QWidget()
        backup_layout = QHBoxLayout(backup_row)
        backup_layout.setContentsMargins(0, 0, 0, 0)
        backup_layout.setSpacing(8)
        backup_layout.addWidget(self.backup_path_input, 1)
        backup_layout.addWidget(browse_button)

        form_layout = QFormLayout()
        form_layout.setContentsMargins(0, 0, 0, 0)
        form_layout.setHorizontalSpacing(12)
        form_layout.setVerticalSpacing(14)
        form_layout.addRow("Nome", self.name_input)
        form_layout.addRow("Moeda", self.currency_input)
        form_layout.addRow("Backup", backup_row)

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Cancel | QDialogButtonBox.StandardButton.Save
        )
        buttons.rejected.connect(self.reject)
        buttons.accepted.connect(self.validate_and_accept)

        cancel_button = buttons.button(QDialogButtonBox.StandardButton.Cancel)
        save_button = buttons.button(QDialogButtonBox.StandardButton.Save)
        if cancel_button is not None:
            cancel_button.setObjectName("secondaryButton")
        if save_button is not None:
            save_button.setObjectName("primaryButton")

        title = QLabel("Bem-vindo ao DevFlow")
        title.setObjectName("pageTitle")

        description = QLabel(
            "A base visual foi preparada no tema preto. Defina o nome, a moeda e a pasta de backup."
        )
        description.setWordWrap(True)
        description.setObjectName("subtleText")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        layout.addWidget(title)
        layout.addWidget(description)
        layout.addLayout(form_layout)
        layout.addWidget(buttons)

    def choose_backup_folder(self) -> None:
        base_path = self.backup_path_input.text().strip() or str(Path.home())
        chosen_dir = QFileDialog.getExistingDirectory(self, "Selecionar pasta de backup", base_path)
        if chosen_dir:
            self.backup_path_input.setText(chosen_dir)

    def validate_and_accept(self) -> None:
        nome = self.name_input.text().strip()
        backup_path = self.backup_path_input.text().strip()

        if not nome:
            QMessageBox.warning(self, "Campo obrigatorio", "Informe o nome do usuario.")
            return

        if not backup_path:
            QMessageBox.warning(self, "Campo obrigatorio", "Informe uma pasta de backup valida.")
            return

        try:
            Path(backup_path).mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            QMessageBox.warning(self, "Pasta invalida", f"Nao foi possivel usar a pasta: {exc}")
            return

        self.accept()

    def values(self) -> dict[str, str]:
        return {
            "nome_usuario": self.name_input.text().strip(),
            "moeda": self.currency_input.currentData(),
            "caminho_backup": self.backup_path_input.text().strip(),
        }
