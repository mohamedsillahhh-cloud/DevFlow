from __future__ import annotations

from datetime import date, datetime

from PyQt6.QtCore import QDate, QDateTime
from PyQt6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QDateEdit,
    QDateTimeEdit,
    QDialog,
    QDialogButtonBox,
    QDoubleSpinBox,
    QFormLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPlainTextEdit,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

from database.models import Investimento, Projeto


def _to_qdate(value: date | None) -> QDate:
    if value is None:
        return QDate.currentDate()
    return QDate(value.year, value.month, value.day)


def _to_qdatetime(value: datetime | None) -> QDateTime:
    if value is None:
        return QDateTime.currentDateTime()
    return QDateTime(value.year, value.month, value.day, value.hour, value.minute, value.second)


class BaseFormDialog(QDialog):
    def __init__(self, title: str, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setMinimumWidth(420)

        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(14)

        self.form = QFormLayout()
        self.form.setContentsMargins(0, 0, 0, 0)
        self.form.setSpacing(12)
        self.layout.addLayout(self.form)

        self.buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Cancel | QDialogButtonBox.StandardButton.Save
        )
        self.buttons.rejected.connect(self.reject)
        self.buttons.accepted.connect(self.validate_and_accept)
        self.layout.addWidget(self.buttons)

        cancel_button = self.buttons.button(QDialogButtonBox.StandardButton.Cancel)
        save_button = self.buttons.button(QDialogButtonBox.StandardButton.Save)
        if cancel_button is not None:
            cancel_button.setObjectName("secondaryButton")
        if save_button is not None:
            save_button.setObjectName("primaryButton")

    def warn(self, title: str, text: str) -> None:
        QMessageBox.warning(self, title, text)

    def validate_and_accept(self) -> None:
        self.accept()


class ProjectDialog(BaseFormDialog):
    STATUS_ITEMS = (
        ("Pendente", "pendente"),
        ("Andamento", "em_andamento"),
        ("Parcial", "pago_parcial"),
        ("Pago", "pago"),
        ("Concluido", "concluido"),
        ("Cancelado", "cancelado"),
    )

    def __init__(self, projeto: Projeto | None = None, parent: QWidget | None = None) -> None:
        super().__init__("Projeto", parent)
        self.client_input = QLineEdit(projeto.cliente.nome if projeto and projeto.cliente else "")
        self.title_input = QLineEdit(projeto.titulo if projeto else "")
        self.type_input = QLineEdit(projeto.tipo or "" if projeto else "")
        self.total_input = QDoubleSpinBox()
        self.total_input.setMaximum(999999999.99)
        self.total_input.setDecimals(2)
        self.total_input.setValue(float(projeto.valor_total or 0) if projeto else 0.0)
        self.status_input = QComboBox()
        for label, value in self.STATUS_ITEMS:
            self.status_input.addItem(label, value)
        if projeto is not None:
            index = self.status_input.findData(projeto.status)
            self.status_input.setCurrentIndex(max(index, 0))
        self.deadline_enabled = QCheckBox("Definir prazo")
        self.deadline_enabled.setChecked(projeto is not None and projeto.prazo is not None)
        self.deadline_input = QDateEdit()
        self.deadline_input.setCalendarPopup(True)
        self.deadline_input.setDate(_to_qdate(projeto.prazo if projeto else None))
        self.deadline_input.setEnabled(self.deadline_enabled.isChecked())
        self.deadline_enabled.toggled.connect(self.deadline_input.setEnabled)
        self.repo_input = QLineEdit(projeto.repo_url or "" if projeto else "")
        self.staging_input = QLineEdit(projeto.staging_url or "" if projeto else "")
        self.description_input = QPlainTextEdit(projeto.descricao or "" if projeto else "")
        self.description_input.setMaximumHeight(80)
        self.notes_input = QPlainTextEdit(projeto.notas or "" if projeto else "")
        self.notes_input.setMaximumHeight(80)

        self.form.addRow("Cliente", self.client_input)
        self.form.addRow("Titulo", self.title_input)
        self.form.addRow("Tipo", self.type_input)
        self.form.addRow("Valor total", self.total_input)
        self.form.addRow("Status", self.status_input)
        self.form.addRow(self.deadline_enabled, self.deadline_input)
        self.form.addRow("Repo URL", self.repo_input)
        self.form.addRow("Staging URL", self.staging_input)
        self.form.addRow("Descricao", self.description_input)
        self.form.addRow("Notas", self.notes_input)

    def validate_and_accept(self) -> None:
        if not self.client_input.text().strip():
            self.warn("Campo obrigatorio", "Informe o cliente.")
            return
        if not self.title_input.text().strip():
            self.warn("Campo obrigatorio", "Informe o titulo do projeto.")
            return
        self.accept()

    def values(self) -> dict[str, object]:
        prazo = self.deadline_input.date().toPyDate() if self.deadline_enabled.isChecked() else None
        return {
            "cliente_nome": self.client_input.text().strip(),
            "titulo": self.title_input.text().strip(),
            "tipo": self.type_input.text().strip() or None,
            "valor_total": float(self.total_input.value()),
            "status": self.status_input.currentData(),
            "prazo": prazo,
            "repo_url": self.repo_input.text().strip() or None,
            "staging_url": self.staging_input.text().strip() or None,
            "descricao": self.description_input.toPlainText().strip() or None,
            "notas": self.notes_input.toPlainText().strip() or None,
        }


class PaymentDialog(BaseFormDialog):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__("Registrar pagamento", parent)
        self.amount_input = QDoubleSpinBox()
        self.amount_input.setMaximum(999999999.99)
        self.amount_input.setDecimals(2)
        self.date_input = QDateEdit()
        self.date_input.setCalendarPopup(True)
        self.date_input.setDate(QDate.currentDate())
        self.method_input = QLineEdit()
        self.notes_input = QPlainTextEdit()
        self.notes_input.setMaximumHeight(80)

        self.form.addRow("Valor", self.amount_input)
        self.form.addRow("Data", self.date_input)
        self.form.addRow("Metodo", self.method_input)
        self.form.addRow("Notas", self.notes_input)

    def validate_and_accept(self) -> None:
        if self.amount_input.value() <= 0:
            self.warn("Valor invalido", "Informe um valor maior do que zero.")
            return
        self.accept()

    def values(self) -> dict[str, object]:
        return {
            "valor": float(self.amount_input.value()),
            "data_pagamento": self.date_input.date().toPyDate(),
            "metodo": self.method_input.text().strip() or None,
            "notas": self.notes_input.toPlainText().strip() or None,
        }


class FinanceEntryDialog(BaseFormDialog):
    def __init__(
        self,
        mode: str,
        projetos: list[Projeto] | None = None,
        parent: QWidget | None = None,
    ) -> None:
        title = "Novo gasto" if mode == "gasto" else "Nova receita"
        super().__init__(title, parent)
        self.mode = mode
        self.projetos = projetos or []

        self.description_input = QLineEdit()
        self.value_input = QDoubleSpinBox()
        self.value_input.setMaximum(999999999.99)
        self.value_input.setDecimals(2)
        self.date_input = QDateEdit()
        self.date_input.setCalendarPopup(True)
        self.date_input.setDate(QDate.currentDate())
        self.method_input = QLineEdit()
        self.notes_input = QPlainTextEdit()
        self.notes_input.setMaximumHeight(80)

        self.form.addRow("Descricao", self.description_input)
        self.form.addRow("Valor", self.value_input)
        self.form.addRow("Data", self.date_input)

        if mode == "gasto":
            self.category_input = QComboBox()
            self.category_input.setEditable(True)
            self.category_input.addItems(
                [
                    "Moradia",
                    "Alimentacao",
                    "Contas",
                    "Internet",
                    "Luz",
                    "Agua",
                    "Transporte",
                    "Ferramentas/SaaS",
                    "Lazer",
                    "Outros",
                ]
            )
            self.recurring_input = QCheckBox("Conta recorrente")
            self.due_day_input = QSpinBox()
            self.due_day_input.setRange(0, 31)
            self.due_day_input.setSpecialValueText("Nenhum")
            self.paid_input = QCheckBox("Ja foi pago")
            self.paid_input.setChecked(True)
            self.form.addRow("Categoria", self.category_input)
            self.form.addRow(self.recurring_input, self.due_day_input)
            self.form.addRow(self.paid_input, QLabel(""))
            self.form.addRow("Metodo", self.method_input)
        else:
            self.project_input = QComboBox()
            self.project_input.addItem("Sem projeto", None)
            for projeto in self.projetos:
                self.project_input.addItem(projeto.titulo, projeto.id)
            self.origin_input = QLineEdit()
            self.form.addRow("Projeto", self.project_input)
            self.form.addRow("Origem", self.origin_input)

        self.form.addRow("Notas", self.notes_input)

    def validate_and_accept(self) -> None:
        if not self.description_input.text().strip():
            self.warn("Campo obrigatorio", "Informe a descricao.")
            return
        if self.value_input.value() <= 0:
            self.warn("Valor invalido", "Informe um valor maior do que zero.")
            return
        self.accept()

    def values(self) -> dict[str, object]:
        values: dict[str, object] = {
            "descricao": self.description_input.text().strip(),
            "valor": float(self.value_input.value()),
            "notas": self.notes_input.toPlainText().strip() or None,
        }
        if self.mode == "gasto":
            values.update(
                {
                    "data_gasto": self.date_input.date().toPyDate(),
                    "categoria": self.category_input.currentText().strip() or None,
                    "recorrente": self.recurring_input.isChecked(),
                    "dia_vencimento": self.due_day_input.value() or None,
                    "metodo": self.method_input.text().strip() or None,
                    "pago": self.paid_input.isChecked(),
                }
            )
        else:
            values.update(
                {
                    "data_receita": self.date_input.date().toPyDate(),
                    "origem": self.origin_input.text().strip() or None,
                    "projeto_id": self.project_input.currentData(),
                }
            )
        return values


class InvestmentAporteDialog(BaseFormDialog):
    def __init__(self, investimentos: list[Investimento], parent: QWidget | None = None) -> None:
        super().__init__("Registrar aporte", parent)
        self.investimentos = investimentos

        self.investment_input = QComboBox()
        self.investment_input.addItem("Novo investimento", None)
        for item in investimentos:
            self.investment_input.addItem(item.nome, item.id)
        self.investment_input.currentIndexChanged.connect(self._toggle_new_investment_fields)

        self.new_name_input = QLineEdit()
        self.new_type_input = QLineEdit()
        self.meta_value_input = QDoubleSpinBox()
        self.meta_value_input.setMaximum(999999999.99)
        self.meta_value_input.setDecimals(2)
        self.meta_date_input = QDateEdit()
        self.meta_date_input.setCalendarPopup(True)
        self.meta_date_input.setDate(QDate.currentDate())
        self.value_input = QDoubleSpinBox()
        self.value_input.setMaximum(999999999.99)
        self.value_input.setDecimals(2)
        self.date_input = QDateEdit()
        self.date_input.setCalendarPopup(True)
        self.date_input.setDate(QDate.currentDate())
        self.type_input = QComboBox()
        self.type_input.addItem("Aporte", "aporte")
        self.type_input.addItem("Resgate", "resgate")
        self.type_input.addItem("Rendimento", "rendimento")
        self.notes_input = QPlainTextEdit()
        self.notes_input.setMaximumHeight(80)

        self.form.addRow("Investimento", self.investment_input)
        self.form.addRow("Nome novo", self.new_name_input)
        self.form.addRow("Tipo novo", self.new_type_input)
        self.form.addRow("Meta valor", self.meta_value_input)
        self.form.addRow("Meta data", self.meta_date_input)
        self.form.addRow("Valor", self.value_input)
        self.form.addRow("Data", self.date_input)
        self.form.addRow("Tipo de movimento", self.type_input)
        self.form.addRow("Notas", self.notes_input)
        self._toggle_new_investment_fields()

    def _toggle_new_investment_fields(self) -> None:
        is_new = self.investment_input.currentData() is None
        for widget in (
            self.new_name_input,
            self.new_type_input,
            self.meta_value_input,
            self.meta_date_input,
        ):
            widget.setEnabled(is_new)

    def validate_and_accept(self) -> None:
        if self.value_input.value() <= 0:
            self.warn("Valor invalido", "Informe um valor maior do que zero.")
            return
        if self.investment_input.currentData() is None:
            if not self.new_name_input.text().strip():
                self.warn("Campo obrigatorio", "Informe o nome do investimento.")
                return
            if not self.new_type_input.text().strip():
                self.warn("Campo obrigatorio", "Informe o tipo do investimento.")
                return
        self.accept()

    def values(self) -> dict[str, object]:
        meta_value = float(self.meta_value_input.value()) or None
        return {
            "investimento_id": self.investment_input.currentData(),
            "investimento_nome": self.new_name_input.text().strip() or None,
            "investimento_tipo": self.new_type_input.text().strip() or None,
            "meta_valor": meta_value,
            "meta_data": self.meta_date_input.date().toPyDate() if meta_value else None,
            "valor": float(self.value_input.value()),
            "data_aporte": self.date_input.date().toPyDate(),
            "tipo": self.type_input.currentData(),
            "notas": self.notes_input.toPlainText().strip() or None,
        }


class StartSessionDialog(BaseFormDialog):
    def __init__(self, projetos: list[Projeto], parent: QWidget | None = None) -> None:
        super().__init__("Iniciar sessao", parent)
        self.project_input = QComboBox()
        for projeto in projetos:
            self.project_input.addItem(projeto.titulo, projeto.id)
        self.description_input = QLineEdit()
        self.form.addRow("Projeto", self.project_input)
        self.form.addRow("Descricao", self.description_input)

    def validate_and_accept(self) -> None:
        if self.project_input.count() == 0:
            self.warn("Sem projetos", "Cadastre um projeto antes de iniciar o timer.")
            return
        self.accept()

    def values(self) -> dict[str, object]:
        return {
            "projeto_id": self.project_input.currentData(),
            "descricao": self.description_input.text().strip() or None,
        }


class ManualSessionDialog(BaseFormDialog):
    def __init__(self, projetos: list[Projeto], parent: QWidget | None = None) -> None:
        super().__init__("Sessao manual", parent)
        self.project_input = QComboBox()
        for projeto in projetos:
            self.project_input.addItem(projeto.titulo, projeto.id)
        self.start_input = QDateTimeEdit()
        self.start_input.setCalendarPopup(True)
        self.start_input.setDateTime(QDateTime.currentDateTime().addSecs(-3600))
        self.end_input = QDateTimeEdit()
        self.end_input.setCalendarPopup(True)
        self.end_input.setDateTime(QDateTime.currentDateTime())
        self.description_input = QLineEdit()
        self.form.addRow("Projeto", self.project_input)
        self.form.addRow("Inicio", self.start_input)
        self.form.addRow("Fim", self.end_input)
        self.form.addRow("Descricao", self.description_input)

    def validate_and_accept(self) -> None:
        if self.project_input.count() == 0:
            self.warn("Sem projetos", "Cadastre um projeto antes de registar horas.")
            return
        if self.end_input.dateTime() <= self.start_input.dateTime():
            self.warn("Horario invalido", "O fim deve ser posterior ao inicio.")
            return
        self.accept()

    def values(self) -> dict[str, object]:
        return {
            "projeto_id": self.project_input.currentData(),
            "inicio": self.start_input.dateTime().toPyDateTime(),
            "fim": self.end_input.dateTime().toPyDateTime(),
            "descricao": self.description_input.text().strip() or None,
        }


class StopSessionDialog(BaseFormDialog):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__("Parar sessao", parent)
        self.description_input = QLineEdit()
        self.form.addRow("Descricao final", self.description_input)

    def values(self) -> dict[str, object]:
        return {"descricao": self.description_input.text().strip() or None}


class AlertsDialog(QDialog):
    def __init__(self, alerts: list[tuple[str, bool]], parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Alertas")
        self.setMinimumWidth(460)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        if alerts:
            for text, danger in alerts:
                label = QLabel(text)
                label.setWordWrap(True)
                label.setStyleSheet(
                    "color: #E24B4A;" if danger else "color: #EF9F27;"
                )
                layout.addWidget(label)
        else:
            empty = QLabel("Nenhum alerta ativo.")
            empty.setObjectName("subtleText")
            layout.addWidget(empty)

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        buttons.rejected.connect(self.reject)
        buttons.accepted.connect(self.accept)
        layout.addWidget(buttons)
