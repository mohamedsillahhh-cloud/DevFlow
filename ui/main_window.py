from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path

from PyQt6.QtCore import QEasingCurve, QPropertyAnimation, Qt, QTimer
from PyQt6.QtGui import QCloseEvent, QMouseEvent
from PyQt6.QtWidgets import (
    QAbstractItemView,
    QComboBox,
    QFileDialog,
    QFormLayout,
    QFrame,
    QGraphicsOpacityEffect,
    QGridLayout,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QStackedWidget,
    QStatusBar,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from database.models import AppSnapshot, Aporte, Gasto, Investimento, Projeto, Receita, TempoProjeto
from database.queries import SupabaseRepository
from ui.forms import (
    AlertsDialog,
    FinanceEntryDialog,
    InvestmentAporteDialog,
    ManualSessionDialog,
    PaymentDialog,
    ProjectDialog,
    StartSessionDialog,
    StopSessionDialog,
)
from ui.theme import APP_VERSION, CORES, DEFAULT_CONFIG, MOEDA_OPCOES
from utils.exportacao import exportar_sessoes_para_excel
from utils.formatacao import cor_prazo, formatar_moeda, percentual


class TitleBar(QFrame):
    def __init__(self, settings_callback) -> None:
        super().__init__()
        self.settings_callback = settings_callback
        self.drag_offset = None
        self.setObjectName("titleBar")
        self.setFixedHeight(38)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 0, 12, 0)
        layout.setSpacing(6)
        layout.addWidget(self._circle("#ff5f56", self._close))
        layout.addWidget(self._circle("#ffbd2e", self._minimize))
        layout.addWidget(self._circle("#27c93f", self._maximize))
        layout.addSpacing(8)

        title = QLabel("DevFlow")
        title.setObjectName("titleBarText")
        layout.addWidget(title)
        layout.addStretch(1)

        self.alert_button = QPushButton("0 alertas")
        self.alert_button.setObjectName("alertButton")
        self.alert_button.setCursor(Qt.CursorShape.PointingHandCursor)

        gear = QPushButton("⚙")
        gear.setObjectName("gearButton")
        gear.setCursor(Qt.CursorShape.PointingHandCursor)
        gear.clicked.connect(self.settings_callback)

        layout.addWidget(self.alert_button)
        layout.addWidget(gear)

    def set_alert_count(self, count: int) -> None:
        suffix = "alerta" if count == 1 else "alertas"
        self.alert_button.setText(f"{count} {suffix}")

    def _circle(self, color: str, callback) -> QPushButton:
        button = QPushButton()
        button.setObjectName("circleControl")
        button.setStyleSheet(f"QPushButton#circleControl {{ background-color: {color}; }}")
        button.clicked.connect(callback)
        return button

    def _close(self) -> None:
        self.window().close()

    def _minimize(self) -> None:
        self.window().showMinimized()

    def _maximize(self) -> None:
        window = self.window()
        if window.isMaximized():
            window.showNormal()
            return
        window.showMaximized()

    def mousePressEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_offset = event.globalPosition().toPoint() - self.window().frameGeometry().topLeft()
            event.accept()
            return
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event: QMouseEvent) -> None:
        if (
            self.drag_offset is not None
            and event.buttons() & Qt.MouseButton.LeftButton
            and not self.window().isMaximized()
        ):
            self.window().move(event.globalPosition().toPoint() - self.drag_offset)
            event.accept()
            return
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event: QMouseEvent) -> None:
        self.drag_offset = None
        super().mouseReleaseEvent(event)

    def mouseDoubleClickEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self._maximize()
            event.accept()
            return
        super().mouseDoubleClickEvent(event)


class PulseDot(QLabel):
    def __init__(self) -> None:
        super().__init__()
        self.setFixedSize(7, 7)
        self.setStyleSheet(f"background-color: {CORES['green']}; border-radius: 3px;")
        effect = QGraphicsOpacityEffect(self)
        effect.setOpacity(1.0)
        self.setGraphicsEffect(effect)
        animation = QPropertyAnimation(effect, b"opacity", self)
        animation.setStartValue(1.0)
        animation.setEndValue(0.35)
        animation.setDuration(900)
        animation.setLoopCount(-1)
        animation.setEasingCurve(QEasingCurve.Type.InOutQuad)
        animation.start()
        self.animation = animation

    def set_active(self, active: bool) -> None:
        if active:
            self.setStyleSheet(f"background-color: {CORES['green']}; border-radius: 3px;")
            self.animation.start()
            return

        self.setStyleSheet(f"background-color: {CORES['text3']}; border-radius: 3px;")
        self.animation.stop()
        effect = self.graphicsEffect()
        if effect is not None:
            effect.setOpacity(1.0)


class MainWindow(QMainWindow):
    def __init__(self, repository: SupabaseRepository, configuracoes: dict[str, str]) -> None:
        super().__init__()
        self.repository = repository
        self.configuracoes = configuracoes
        self.data = AppSnapshot()
        self.nav_buttons: dict[str, QPushButton] = {}
        self.pages: dict[str, QWidget] = {}
        self.project_search_term = ""
        self.project_status_filter = "Todos os status"
        self.finance_month_offset = 0
        self.timer_display_label: QLabel | None = None
        self.timer_project_label: QLabel | None = None
        self.timer_pause_button: QPushButton | None = None
        self.timer_stop_button: QPushButton | None = None
        self.chat_input: QPlainTextEdit | None = None

        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        self.setWindowTitle("DevFlow")
        self.resize(1360, 820)
        self.setMinimumSize(1180, 760)

        self._build_ui()
        self._rebuild_pages()
        self.switch_page("dashboard")

        self.runtime_timer = QTimer(self)
        self.runtime_timer.setInterval(1000)
        self.runtime_timer.timeout.connect(self._refresh_runtime_status)
        self.runtime_timer.start()

    def _build_ui(self) -> None:
        shell = QWidget()
        shell.setObjectName("appShell")
        self.setCentralWidget(shell)

        root = QVBoxLayout(shell)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        self.title_bar = TitleBar(lambda: self.switch_page("configuracoes"))
        self.title_bar.alert_button.clicked.connect(self._show_alerts)
        root.addWidget(self.title_bar)

        body = QWidget()
        body_layout = QHBoxLayout(body)
        body_layout.setContentsMargins(0, 0, 0, 0)
        body_layout.setSpacing(0)
        body_layout.addWidget(self._build_sidebar())

        self.stack = QStackedWidget()
        self.stack.setObjectName("contentHost")
        body_layout.addWidget(self.stack, 1)
        root.addWidget(body, 1)

        self._build_status_bar()

    def _build_sidebar(self) -> QWidget:
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(48)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(7, 12, 7, 12)
        layout.setSpacing(4)

        items = (
            ("dashboard", "🏠", "Dashboard"),
            ("projetos", "📁", "Projetos"),
            ("financas", "💰", "Financas"),
            ("investimentos", "📈", "Investimentos"),
            ("timer", "⏱", "Timer"),
        )
        for key, icon_text, label in items:
            button = self._nav_button(icon_text, label, key)
            layout.addWidget(button, 0, Qt.AlignmentFlag.AlignHCenter)
            self.nav_buttons[key] = button

        layout.addStretch(1)
        chat = self._nav_button("C", "Chat", "chat")
        layout.addWidget(chat, 0, Qt.AlignmentFlag.AlignHCenter)
        self.nav_buttons["chat"] = chat
        config = self._nav_button("⚙", "Configuracoes", "configuracoes")
        layout.addWidget(config, 0, Qt.AlignmentFlag.AlignHCenter)
        self.nav_buttons["configuracoes"] = config
        return sidebar

    def _nav_button(self, icon_text: str, tooltip: str, page_key: str) -> QPushButton:
        button = QPushButton(icon_text)
        button.setObjectName("navButton")
        button.setCheckable(True)
        button.setFixedSize(34, 34)
        button.setCursor(Qt.CursorShape.PointingHandCursor)
        button.setToolTip(tooltip)
        button.clicked.connect(lambda checked=False, key=page_key: self.switch_page(key))
        return button

    def _build_status_bar(self) -> None:
        status_bar = QStatusBar()
        status_bar.setSizeGripEnabled(False)
        self.setStatusBar(status_bar)
        self.status_pulse = PulseDot()
        status_bar.addWidget(self.status_pulse)

        self.status_timer_label = QLabel()
        status_bar.addWidget(self.status_timer_label)

        self.stop_button = QPushButton("Parar")
        self.stop_button.setObjectName("statusStopButton")
        self.stop_button.setEnabled(False)
        self.stop_button.clicked.connect(self._stop_active_session)
        status_bar.addWidget(self.stop_button)

        self.backup_label = QLabel()
        self.backup_label.setObjectName("mutedText")
        status_bar.addPermanentWidget(self.backup_label)
        self._refresh_footer()

    def _refresh_footer(self) -> None:
        backup = self.configuracoes.get("ultimo_backup", "nunca")
        self.backup_label.setText(f"Backup: {backup} · {APP_VERSION}")

    def _reload_data(self, show_errors: bool = True) -> None:
        try:
            self.data = self.repository.load_snapshot()
        except Exception as exc:
            self.data = AppSnapshot()
            if show_errors:
                QMessageBox.warning(
                    self,
                    "Falha na sincronizacao",
                    f"Nao foi possivel carregar os dados do Supabase:\n{exc}",
                )

    def _show_operation_error(self, exc: Exception, title: str = "Operacao nao concluida") -> None:
        QMessageBox.warning(self, title, str(exc))

    def _run_action(
        self,
        callback,
        success_message: str | None = None,
        title: str = "Operacao nao concluida",
    ):
        try:
            result = callback()
        except Exception as exc:
            self._show_operation_error(exc, title)
            return None
        self._rebuild_pages()
        if success_message:
            QMessageBox.information(self, "Concluido", success_message)
        return result

    def current_page_key(self) -> str:
        current = self.stack.currentWidget()
        for key, widget in self.pages.items():
            if widget is current:
                return key
        return "dashboard"

    def _rebuild_pages(self) -> None:
        current = self.current_page_key()
        self._reload_data()
        self.timer_display_label = None
        self.timer_project_label = None
        self.timer_pause_button = None
        self.timer_stop_button = None
        self.chat_input = None
        while self.stack.count():
            widget = self.stack.widget(0)
            self.stack.removeWidget(widget)
            widget.deleteLater()

        self.pages = {
            "dashboard": self._page_dashboard(),
            "projetos": self._page_projects(),
            "financas": self._page_finance(),
            "investimentos": self._page_investments(),
            "timer": self._page_timer(),
            "chat": self._page_chat(),
            "configuracoes": self._page_settings(),
        }
        for page in self.pages.values():
            self.stack.addWidget(page)
        self._refresh_runtime_status()
        self.switch_page(current if current in self.pages else "dashboard")

    def switch_page(self, page_key: str) -> None:
        if page_key not in self.pages:
            return
        self.stack.setCurrentWidget(self.pages[page_key])
        for key, button in self.nav_buttons.items():
            button.setChecked(key == page_key)

    def _wrap_page(self, content: QWidget) -> QScrollArea:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        host = QWidget()
        host_layout = QVBoxLayout(host)
        host_layout.setContentsMargins(16, 16, 16, 16)
        host_layout.addWidget(content)
        scroll.setWidget(host)
        return scroll

    def _page_root(self) -> tuple[QWidget, QVBoxLayout]:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)
        return page, layout

    def _page_header(self, title: str, right: QWidget | None = None) -> QWidget:
        host = QWidget()
        layout = QHBoxLayout(host)
        layout.setContentsMargins(0, 0, 0, 0)
        title_label = QLabel(title)
        title_label.setObjectName("pageTitle")
        layout.addWidget(title_label)
        layout.addStretch(1)
        if right is not None:
            layout.addWidget(right)
        return host

    def _metric_card(self, title: str, value: str, subtitle: str, color: str | None = None) -> QFrame:
        card = QFrame()
        card.setObjectName("metricCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(13, 11, 13, 11)
        layout.setSpacing(4)
        for object_name, text in (
            ("metricLabel", title),
            ("metricValue", value),
            ("metricSubtitle", subtitle),
        ):
            label = QLabel(text)
            label.setObjectName(object_name)
            if object_name == "metricValue" and color:
                label.setStyleSheet(f"color: {color};")
            layout.addWidget(label)
        return card

    def _metrics_grid(self, cards: list[QFrame], columns: int) -> QWidget:
        host = QWidget()
        layout = QGridLayout(host)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setHorizontalSpacing(8)
        layout.setVerticalSpacing(8)
        for index, card in enumerate(cards):
            layout.addWidget(card, index // columns, index % columns)
        return host

    def _section_card(self, title: str) -> tuple[QFrame, QVBoxLayout]:
        card = QFrame()
        card.setObjectName("sectionCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)
        label = QLabel(title.upper())
        label.setObjectName("sectionTitle")
        layout.addWidget(label)
        return card, layout

    def _alert(self, text: str, danger: bool = False) -> QFrame:
        card = QFrame()
        card.setObjectName("alertCardDanger" if danger else "alertCard")
        layout = QHBoxLayout(card)
        layout.setContentsMargins(12, 9, 12, 9)
        icon = QLabel("●")
        icon.setStyleSheet(f"color: {CORES['red' if danger else 'yellow']};")
        label = QLabel(text)
        label.setWordWrap(True)
        label.setStyleSheet(
            f"font-size: 12px; color: {CORES['red' if danger else 'yellow']};"
        )
        layout.addWidget(icon)
        layout.addWidget(label, 1)
        return card

    def _pill(self, status: str) -> QLabel:
        palette = {
            "Pago": ("#051a0e", CORES["green"], "#0a3a20"),
            "Parcial": ("#1a0e00", CORES["yellow"], "#3a2200"),
            "Pendente": ("#1a0000", CORES["red"], "#3d0000"),
            "Andamento": ("#001020", CORES["blue"], "#003050"),
            "Concluido": ("#05140f", "#00C97B", "#093b28"),
            "Cancelado": (CORES["bg3"], CORES["text2"], CORES["border"]),
            "Pausado": ("#151515", CORES["text2"], CORES["border"]),
        }
        visible_status = self._display_status(status)
        bg, fg, border = palette.get(
            visible_status, (CORES["bg3"], CORES["text2"], CORES["border"])
        )
        label = QLabel(visible_status)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        label.setStyleSheet(
            f"border-radius:99px;padding:2px 8px;font-size:10px;background:{bg};color:{fg};border:1px solid {border};"
        )
        return label

    def _color_text(self, text: str, color: str) -> QLabel:
        label = QLabel(text)
        label.setStyleSheet(f"color: {color};")
        return label

    def _action_group(self, *labels: str) -> QWidget:
        host = QWidget()
        layout = QHBoxLayout(host)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)
        style = (
            f"QPushButton {{background:{CORES['bg2']};border:1px solid {CORES['border']};"
            f"border-radius:6px;color:{CORES['text2']};font-size:10px;padding:0px;}}"
            f"QPushButton:hover {{background:{CORES['bg3']};color:{CORES['text']};}}"
        )
        for label in labels:
            button = QPushButton(label)
            button.setFixedSize(22, 22)
            button.setStyleSheet(style)
            layout.addWidget(button)
        return host

    def _amount_row(self, label: str, amount: str, dot: str, color: str, extra: str = "") -> QWidget:
        row = QWidget()
        layout = QHBoxLayout(row)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        bullet = QLabel("●")
        bullet.setStyleSheet(f"color:{dot};font-size:10px;")
        text = QLabel(label if not extra else f"{label} {extra}")
        text.setObjectName("subtleText")
        value = QLabel(amount)
        value.setStyleSheet(f"color:{color};")
        layout.addWidget(bullet)
        layout.addWidget(text)
        layout.addStretch(1)
        layout.addWidget(value)
        return row

    def _table(self, headers: list[str], rows: list[list[object]], height: int = 240) -> QTableWidget:
        table = QTableWidget(len(rows), len(headers))
        table.setHorizontalHeaderLabels(headers)
        table.setShowGrid(False)
        table.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        table.setSelectionMode(QAbstractItemView.SelectionMode.NoSelection)
        table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        table.verticalHeader().setVisible(False)
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        table.horizontalHeader().setHighlightSections(False)
        table.setMinimumHeight(height)
        for row_index, row in enumerate(rows):
            for column_index, value in enumerate(row):
                if isinstance(value, QWidget):
                    table.setCellWidget(row_index, column_index, value)
                    continue
                table.setItem(row_index, column_index, QTableWidgetItem(str(value)))
        return table

    def _table_actions(self, actions: list[tuple[str, str, object]]) -> QWidget:
        host = QWidget()
        layout = QHBoxLayout(host)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)
        for label, tooltip, callback in actions:
            button = QPushButton(label)
            button.setFixedSize(24, 24)
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.setToolTip(tooltip)
            button.setStyleSheet(
                f"QPushButton {{background:{CORES['bg2']};border:1px solid {CORES['border']};"
                f"border-radius:6px;color:{CORES['text2']};font-size:10px;padding:0px;}}"
                f"QPushButton:hover {{background:{CORES['bg3']};color:{CORES['text']};}}"
            )
            button.clicked.connect(callback)
            layout.addWidget(button)
        return host

    def _money(self, value: float) -> str:
        return formatar_moeda(value, self.configuracoes.get("moeda", "CVE"))

    def _month_bounds(self, reference: date | None = None) -> tuple[date, date]:
        current = reference or date.today()
        month_start = current.replace(day=1)
        if month_start.month == 12:
            next_month = date(month_start.year + 1, 1, 1)
        else:
            next_month = date(month_start.year, month_start.month + 1, 1)
        return month_start, next_month

    def _shift_month(self, reference: date, offset: int) -> date:
        month_index = (reference.year * 12 + reference.month - 1) + offset
        year = month_index // 12
        month = month_index % 12 + 1
        return date(year, month, 1)

    def _sum_amount(self, items: list[object], attribute: str, predicate=None) -> float:
        total = 0.0
        for item in items:
            if predicate is not None and not predicate(item):
                continue
            total += float(getattr(item, attribute, 0) or 0)
        return total

    def _count_items(self, items: list[object], predicate=None) -> int:
        if predicate is None:
            return len(items)
        return sum(1 for item in items if predicate(item))

    def _project_due(self, project: Projeto) -> float:
        return max(float(project.valor_total or 0) - float(project.valor_pago or 0), 0.0)

    def _is_open_project(self, project: Projeto) -> bool:
        return project.status not in {"concluido", "cancelado", "pago"}

    def _in_date_range(self, value: date | None, start: date, end: date) -> bool:
        return value is not None and start <= value < end

    def _in_datetime_range(self, value: datetime | None, start: datetime, end: datetime) -> bool:
        return value is not None and start <= value < end

    def _sorted_projects(self) -> list[Projeto]:
        return sorted(
            self.data.projetos,
            key=lambda item: item.criado_em or datetime.min,
            reverse=True,
        )

    def _filtered_projects(self) -> list[Projeto]:
        search_term = self.project_search_term.strip().lower()
        status_filter = self.project_status_filter
        filtered: list[Projeto] = []
        for project in self._sorted_projects():
            client_name = project.cliente.nome.lower() if project.cliente else ""
            if search_term and search_term not in project.titulo.lower() and search_term not in client_name:
                continue
            if status_filter != "Todos os status" and self._display_status(project.status) != status_filter:
                continue
            filtered.append(project)
        return filtered

    def _sorted_projects_by_deadline(self) -> list[Projeto]:
        return sorted(
            self.data.projetos,
            key=lambda item: (item.prazo is None, item.prazo or date.max),
        )

    def _sorted_gastos(self, recurring_only: bool = False) -> list[Gasto]:
        items = self.data.gastos
        if recurring_only:
            items = [item for item in items if item.recorrente > 0]
        return sorted(
            items,
            key=lambda item: (item.data, item.valor, item.criado_em or datetime.min),
            reverse=True,
        )

    def _sorted_receitas(self) -> list[Receita]:
        return sorted(
            self.data.receitas,
            key=lambda item: (item.data, item.valor, item.criado_em or datetime.min),
            reverse=True,
        )

    def _sorted_aportes(self) -> list[Aporte]:
        return sorted(
            self.data.aportes,
            key=lambda item: (item.data, item.criado_em or datetime.min),
            reverse=True,
        )

    def _investment_total(self, investment_id: int) -> float:
        total = 0.0
        for item in self.data.aportes:
            if item.investimento_id != investment_id:
                continue
            if item.tipo == "resgate":
                total -= float(item.valor or 0)
            else:
                total += float(item.valor or 0)
        return total

    def _monthly_category_totals(self, start: date, end: date) -> list[tuple[str, str, float]]:
        aggregates: dict[str, dict[str, object]] = {}
        for item in self.data.gastos:
            if not self._in_date_range(item.data, start, end):
                continue
            category_name = item.categoria_nome or "Sem categoria"
            current = aggregates.setdefault(
                category_name,
                {
                    "color": item.categoria.cor if item.categoria and item.categoria.cor else CORES["text2"],
                    "value": 0.0,
                },
            )
            current["value"] = float(current["value"]) + float(item.valor or 0)
        rows = [
            (name, str(data["color"]), float(data["value"]))
            for name, data in aggregates.items()
        ]
        return sorted(rows, key=lambda item: item[2], reverse=True)

    def _display_status(self, raw_status: str | None) -> str:
        mapping = {
            "pendente": "Pendente",
            "em_andamento": "Andamento",
            "pago_parcial": "Parcial",
            "pago": "Pago",
            "concluido": "Concluido",
            "cancelado": "Cancelado",
            "pausado": "Pausado",
        }
        if not raw_status:
            return "-"
        return mapping.get(raw_status, raw_status.replace("_", " ").title())

    def _display_date(self, raw_date: date | None) -> str:
        if raw_date is None:
            return "-"
        return raw_date.strftime("%d/%m")

    def _display_datetime(self, raw_datetime: datetime | None) -> str:
        if raw_datetime is None:
            return "-"
        return raw_datetime.strftime("%d/%m/%Y %H:%M")

    def _duration_text(self, total_minutes: int) -> str:
        hours, minutes = divmod(max(total_minutes, 0), 60)
        if hours == 0:
            return f"{minutes}min"
        return f"{hours}h {minutes:02d}min"

    def _duration_hms(self, start: datetime, end: datetime | None = None) -> str:
        final = end or datetime.now()
        total_seconds = max(int((final - start).total_seconds()), 0)
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def _empty_card(self, title: str, message: str) -> QFrame:
        card, layout = self._section_card(title)
        label = QLabel(message)
        label.setWordWrap(True)
        label.setObjectName("subtleText")
        layout.addWidget(label)
        return card

    def _current_alerts(self) -> list[tuple[str, bool]]:
        alerts: list[tuple[str, bool]] = []
        today = date.today()
        prazo_days = int(self.configuracoes.get("alerta_prazo_dias", "7"))
        conta_days = int(self.configuracoes.get("alerta_conta_dias", "3"))

        upcoming_projects = [
            project
            for project in self._sorted_projects_by_deadline()
            if project.prazo is not None
            and today <= project.prazo <= today + timedelta(days=prazo_days)
            and self._is_open_project(project)
        ]
        for project in upcoming_projects:
            client_name = project.cliente.nome if project.cliente else "Cliente"
            missing = self._project_due(project)
            days_left = max((project.prazo - today).days if project.prazo else 0, 0)
            alerts.append(
                (
                    f"{project.titulo} ({client_name}): {self._money(missing)} pendente, prazo em {days_left} dias",
                    False,
                )
            )

        overdue_projects = [
            project
            for project in self._sorted_projects_by_deadline()
            if project.prazo is not None
            and project.prazo < today
            and self._project_due(project) > 0
            and self._is_open_project(project)
        ]
        for project in overdue_projects:
            client_name = project.cliente.nome if project.cliente else "Cliente"
            missing = self._project_due(project)
            alerts.append(
                (
                    f"{project.titulo} ({client_name}): {self._money(missing)} em atraso desde {self._display_date(project.prazo)}",
                    True,
                )
            )

        pending_bills = sorted(
            [
                bill
                for bill in self.data.gastos
                if bill.pago == 0 and bill.data <= today + timedelta(days=conta_days)
            ],
            key=lambda item: item.data,
        )
        for bill in pending_bills:
            alerts.append(
                (
                    f"{bill.descricao}: {self._money(bill.valor)} pendente para {self._display_date(bill.data)}",
                    False,
                )
            )

        return alerts

    def _active_session(self) -> TempoProjeto | None:
        active_sessions = [item for item in self.data.tempo_projeto if item.fim is None]
        if not active_sessions:
            return None
        return max(active_sessions, key=lambda item: item.inicio)

    def _refresh_runtime_status(self) -> None:
        alerts = self._current_alerts()
        self.title_bar.set_alert_count(len(alerts))

        active_session = self._active_session()
        if active_session is None:
            self.status_pulse.set_active(False)
            self.status_timer_label.setText("Sem sessao ativa")
            self.status_timer_label.setStyleSheet(
                f"color: {CORES['text3']}; font-size: 11px;"
            )
            self.stop_button.setEnabled(False)
            if self.timer_project_label is not None:
                self.timer_project_label.setText("Inicie um timer num projeto para acompanhar as horas.")
            if self.timer_display_label is not None:
                self.timer_display_label.setText("--:--:--")
            if self.timer_pause_button is not None:
                self.timer_pause_button.setEnabled(False)
            if self.timer_stop_button is not None:
                self.timer_stop_button.setEnabled(False)
            return

        project_name = active_session.projeto.titulo if active_session.projeto else "Projeto"
        self.status_pulse.set_active(True)
        self.status_timer_label.setText(
            f"{project_name} — {self._duration_hms(active_session.inicio, active_session.fim)}"
        )
        self.status_timer_label.setStyleSheet(
            f"color: {CORES['green']}; font-size: 11px;"
        )
        self.stop_button.setEnabled(True)
        if self.timer_project_label is not None:
            self.timer_project_label.setText(project_name)
        if self.timer_display_label is not None:
            self.timer_display_label.setText(self._duration_hms(active_session.inicio, active_session.fim))
        if self.timer_pause_button is not None:
            self.timer_pause_button.setEnabled(True)
        if self.timer_stop_button is not None:
            self.timer_stop_button.setEnabled(True)

    def _dashboard_bars(self) -> QFrame:
        card, layout = self._section_card("Receitas vs gastos - 6 meses")
        month_start, _ = self._month_bounds()
        rows: list[tuple[str, float, float]] = []
        for offset in range(5, -1, -1):
            current_month = month_start
            for _ in range(offset):
                if current_month.month == 1:
                    current_month = date(current_month.year - 1, 12, 1)
                else:
                    current_month = date(current_month.year, current_month.month - 1, 1)

            start, end = self._month_bounds(current_month)
            receitas = self._sum_amount(
                self.data.receitas,
                "valor",
                lambda item, start=start, end=end: self._in_date_range(item.data, start, end),
            )
            gastos = self._sum_amount(
                self.data.gastos,
                "valor",
                lambda item, start=start, end=end: self._in_date_range(item.data, start, end),
            )
            rows.append((start.strftime("%b"), receitas, gastos))

        max_value = max([max(receitas, gastos) for _, receitas, gastos in rows], default=0.0)
        if max_value <= 0:
            empty = QLabel("Sem movimentacao registrada nos ultimos 6 meses.")
            empty.setObjectName("subtleText")
            layout.addWidget(empty)
            return card

        for name, receitas, gastos in rows:
            row = QWidget()
            row_layout = QHBoxLayout(row)
            row_layout.setContentsMargins(0, 0, 0, 0)
            row_layout.setSpacing(10)
            row_layout.addWidget(self._color_text(name, CORES["text2"]))

            bars = QWidget()
            bars_layout = QHBoxLayout(bars)
            bars_layout.setContentsMargins(0, 0, 0, 0)
            bars_layout.setSpacing(6)
            receitas_bar = QFrame()
            receitas_bar.setFixedHeight(16)
            receitas_bar.setStyleSheet(
                f"background:{CORES['green']}; border-radius:4px; min-width:{max(int((receitas / max_value) * 180), 8)}px;"
            )
            gastos_bar = QFrame()
            gastos_bar.setFixedHeight(16)
            gastos_bar.setStyleSheet(
                f"background:{CORES['red']}; border-radius:4px; min-width:{max(int((gastos / max_value) * 180), 8)}px;"
            )
            bars_layout.addWidget(receitas_bar)
            bars_layout.addWidget(gastos_bar)
            total_label = self._color_text(
                f"{self._money(receitas)} / {self._money(gastos)}",
                CORES["text3"],
            )
            row_layout.addWidget(bars, 1)
            row_layout.addWidget(total_label)
            layout.addWidget(row)
        return card

    def _page_dashboard(self) -> QScrollArea:
        page, layout = self._page_root()
        alerts = self._current_alerts()
        if alerts:
            for message, danger in alerts[:3]:
                layout.addWidget(self._alert(message, danger))
        else:
            layout.addWidget(self._empty_card("Alertas", "Nenhum alerta ativo no momento."))

        month_start, next_month = self._month_bounds()
        receitas_mes = self._sum_amount(
            self.data.receitas,
            "valor",
            lambda item: self._in_date_range(item.data, month_start, next_month),
        )
        gastos_mes = self._sum_amount(
            self.data.gastos,
            "valor",
            lambda item: self._in_date_range(item.data, month_start, next_month),
        )
        investido_mes = self._sum_amount(
            self.data.aportes,
            "valor",
            lambda item: item.tipo == "aporte"
            and self._in_date_range(item.data, month_start, next_month),
        )
        categorias_mes = len(
            {
                item.categoria_nome or "Sem categoria"
                for item in self.data.gastos
                if self._in_date_range(item.data, month_start, next_month)
            }
        )
        projetos_total = self._count_items(self.data.projetos)
        ativos_total = self._count_items(self.data.investimentos, lambda item: item.ativo == 1)
        saldo_mes = receitas_mes - gastos_mes - investido_mes
        layout.addWidget(
            self._metrics_grid(
                [
                    self._metric_card(
                        "Receitas",
                        self._money(receitas_mes),
                        f"{projetos_total} projetos",
                        CORES["green"],
                    ),
                    self._metric_card(
                        "Gastos",
                        self._money(gastos_mes),
                        f"{categorias_mes} categorias",
                        CORES["red"],
                    ),
                    self._metric_card(
                        "Investido",
                        self._money(investido_mes),
                        f"{ativos_total} ativos",
                        CORES["blue"],
                    ),
                    self._metric_card(
                        "Saldo liquido",
                        self._money(saldo_mes),
                        "apos aportes",
                        CORES["green"] if saldo_mes >= 0 else CORES["red"],
                    ),
                ],
                4,
            )
        )
        row = QHBoxLayout()
        row.setSpacing(12)
        row.addWidget(self._dashboard_bars(), 1)
        categories, categories_layout = self._section_card("Gastos por categoria")
        category_rows = self._monthly_category_totals(month_start, next_month)
        if category_rows:
            total_categorias = sum(valor for _, _, valor in category_rows)
            for nome, cor, valor in category_rows:
                percentage = f"{(valor / total_categorias * 100):.0f}%" if total_categorias else "0%"
                categories_layout.addWidget(
                    self._amount_row(
                        nome,
                        self._money(valor),
                        cor,
                        CORES["text"],
                        percentage,
                    )
                )
        else:
            categories_layout.addWidget(QLabel("Nenhum gasto registrado no mes atual."))
            categories_layout.itemAt(categories_layout.count() - 1).widget().setObjectName("subtleText")
        row.addWidget(categories, 1)
        layout.addLayout(row)
        title = QLabel("PROXIMOS PRAZOS")
        title.setObjectName("sectionTitle")
        layout.addWidget(title)
        upcoming_projects = [item for item in self._sorted_projects_by_deadline() if item.prazo is not None]
        if upcoming_projects:
            rows = []
            for project in upcoming_projects[:8]:
                client_name = project.cliente.nome if project.cliente else "-"
                rows.append(
                    [
                        client_name,
                        project.titulo,
                        self._money(project.valor_total or 0),
                        self._pill(project.status),
                        self._color_text(
                            self._display_date(project.prazo),
                            cor_prazo(project.prazo),
                        ),
                        self._table_actions(
                            [
                                ("E", "Editar projeto", lambda checked=False, item_id=project.id: self._edit_project(item_id)),
                                ("$", "Registrar pagamento", lambda checked=False, item_id=project.id: self._register_payment(item_id)),
                            ]
                        ),
                    ]
                )
            layout.addWidget(
                self._table(
                    ["CLIENTE", "PROJETO", "VALOR", "STATUS", "PRAZO", "ACAO"],
                    rows,
                )
            )
        else:
            layout.addWidget(
                self._empty_card("Proximos prazos", "Ainda nao ha projetos com prazo cadastrado.")
            )
        return self._wrap_page(page)

    def _page_projects(self) -> QScrollArea:
        page, layout = self._page_root()
        add_button = QPushButton("+ Novo projeto")
        add_button.setObjectName("secondaryButton")
        add_button.clicked.connect(self._new_project)
        layout.addWidget(self._page_header("Projetos", add_button))
        filters = QWidget()
        filters_layout = QHBoxLayout(filters)
        filters_layout.setContentsMargins(0, 0, 0, 0)
        filters_layout.setSpacing(8)
        search = QLineEdit()
        search.setPlaceholderText("Buscar cliente ou projeto...")
        search.setText(self.project_search_term)
        search.textEdited.connect(self._update_project_search_term)
        search.returnPressed.connect(lambda: self._set_project_search(search.text()))
        search.editingFinished.connect(lambda: self._set_project_search(search.text()))
        status = QComboBox()
        status.addItems(["Todos os status", "Pendente", "Andamento", "Pago", "Concluido"])
        status.setCurrentText(self.project_status_filter)
        status.currentTextChanged.connect(self._set_project_status_filter)
        filters_layout.addWidget(search, 1)
        filters_layout.addWidget(status)
        layout.addWidget(filters)

        today = date.today()
        projects = self._filtered_projects()
        a_receber = sum(self._project_due(project) for project in projects)
        em_andamento = sum(1 for project in projects if project.status == "em_andamento")
        atrasados = sum(
            1
            for project in projects
            if project.prazo is not None
            and project.prazo < today
            and project.status not in {"concluido", "cancelado", "pago"}
        )
        layout.addWidget(
            self._metrics_grid(
                [
                    self._metric_card(
                        "A receber",
                        self._money(a_receber),
                        f"{len(projects)} projetos cadastrados",
                        CORES["yellow"],
                    ),
                    self._metric_card(
                        "Em andamento",
                        str(em_andamento),
                        "projetos ativos",
                        CORES["blue"],
                    ),
                    self._metric_card(
                        "Atrasados",
                        str(atrasados),
                        "prazo vencido",
                        CORES["red"],
                    ),
                ],
                3,
            )
        )
        if projects:
            rows = []
            for project in projects:
                client_name = project.cliente.nome if project.cliente else "-"
                rows.append(
                    [
                        client_name,
                        project.titulo,
                        project.tipo or "-",
                        self._money(project.valor_total or 0),
                        self._money(project.valor_pago or 0),
                        percentual(project.valor_pago or 0, project.valor_total or 0),
                        self._pill(project.status),
                        self._color_text(
                            self._display_date(project.prazo),
                            cor_prazo(project.prazo),
                        ),
                        self._table_actions(
                            [
                                ("E", "Editar projeto", lambda checked=False, item_id=project.id: self._edit_project(item_id)),
                                ("$", "Registrar pagamento", lambda checked=False, item_id=project.id: self._register_payment(item_id)),
                                ("X", "Apagar projeto", lambda checked=False, item_id=project.id: self._delete_project(item_id)),
                            ]
                        ),
                    ]
                )
            layout.addWidget(
                self._table(
                    ["CLIENTE", "PROJETO", "TIPO", "TOTAL", "PAGO", "%", "STATUS", "PRAZO", "ACAO"],
                    rows,
                    330,
                )
            )
        else:
            layout.addWidget(
                self._empty_card("Projetos", "Nenhum projeto cadastrado ainda.")
            )
        return self._wrap_page(page)

    def _page_finance(self) -> QScrollArea:
        page, layout = self._page_root()
        actions = QWidget()
        actions_layout = QHBoxLayout(actions)
        actions_layout.setContentsMargins(0, 0, 0, 0)
        actions_layout.setSpacing(8)
        month = QComboBox()
        for offset in range(12):
            reference = self._shift_month(date.today().replace(day=1), -offset)
            month.addItem(reference.strftime("%B %Y").capitalize(), offset)
        month.setCurrentIndex(min(self.finance_month_offset, month.count() - 1))
        month.currentIndexChanged.connect(self._set_finance_month_index)
        month.setMinimumWidth(170)
        month_start, next_month = self._month_bounds(
            self._shift_month(date.today().replace(day=1), -self.finance_month_offset)
        )
        new_button = QPushButton("+ Novo gasto")
        new_button.setObjectName("secondaryButton")
        new_button.clicked.connect(self._new_gasto)
        income_button = QPushButton("+ Nova receita")
        income_button.setObjectName("secondaryButton")
        income_button.clicked.connect(self._new_receita)
        actions_layout.addWidget(month)
        actions_layout.addWidget(new_button)
        actions_layout.addWidget(income_button)
        layout.addWidget(self._page_header("Financas", actions))

        gastos_mes = self._sum_amount(
            self.data.gastos,
            "valor",
            lambda item: self._in_date_range(item.data, month_start, next_month),
        )
        receitas_mes = self._sum_amount(
            self.data.receitas,
            "valor",
            lambda item: self._in_date_range(item.data, month_start, next_month),
        )
        pendentes = self._count_items(
            self.data.gastos,
            lambda item: item.pago == 0 and self._in_date_range(item.data, month_start, next_month),
        )
        saldo_mes = receitas_mes - gastos_mes
        layout.addWidget(
            self._metrics_grid(
                [
                    self._metric_card("Gastos totais", self._money(gastos_mes), "", CORES["red"]),
                    self._metric_card("Receitas", self._money(receitas_mes), "", CORES["green"]),
                    self._metric_card(
                        "Saldo",
                        self._money(saldo_mes),
                        "",
                        CORES["green"] if saldo_mes >= 0 else CORES["red"],
                    ),
                    self._metric_card("Pendentes", str(pendentes), "", CORES["yellow"]),
                ],
                4,
            )
        )
        row = QHBoxLayout()
        row.setSpacing(12)
        expenses, expenses_layout = self._section_card("Gastos do mes")
        expenses_rows = [
            item
            for item in self._sorted_gastos()
            if self._in_date_range(item.data, month_start, next_month)
        ]
        if expenses_rows:
            for item in expenses_rows[:10]:
                dot_color = item.categoria.cor if item.categoria and item.categoria.cor else CORES["text2"]
                expenses_layout.addWidget(
                    self._amount_row(
                        item.descricao,
                        f"-{self._money(item.valor)}",
                        dot_color,
                        CORES["red"],
                    )
                )
        else:
            expenses_layout.addWidget(QLabel("Nenhum gasto registrado neste mes."))
            expenses_layout.itemAt(expenses_layout.count() - 1).widget().setObjectName("subtleText")
        right = QVBoxLayout()
        right.setSpacing(12)
        income, income_layout = self._section_card("Receitas do mes")
        income_rows = [
            item
            for item in self._sorted_receitas()
            if self._in_date_range(item.data, month_start, next_month)
        ]
        if income_rows:
            for item in income_rows[:10]:
                income_layout.addWidget(
                    self._amount_row(
                        item.descricao,
                        f"+{self._money(item.valor)}",
                        CORES["green"],
                        CORES["green"],
                    )
                )
        else:
            income_layout.addWidget(QLabel("Nenhuma receita registrada neste mes."))
            income_layout.itemAt(income_layout.count() - 1).widget().setObjectName("subtleText")
        recurring, recurring_layout = self._section_card("Contas recorrentes")
        recurring_rows = self._sorted_gastos(recurring_only=True)
        if recurring_rows:
            for item in recurring_rows[:10]:
                dot_color = item.categoria.cor if item.categoria and item.categoria.cor else CORES["text2"]
                recurring_layout.addWidget(
                    self._amount_row(
                        item.descricao,
                        "Pago" if item.pago else "Pendente",
                        dot_color,
                        CORES["green"] if item.pago else CORES["yellow"],
                    )
                )
        else:
            recurring_layout.addWidget(QLabel("Nenhuma conta recorrente cadastrada."))
            recurring_layout.itemAt(recurring_layout.count() - 1).widget().setObjectName("subtleText")
        right.addWidget(income)
        right.addWidget(recurring)
        row.addWidget(expenses, 1)
        row.addLayout(right, 1)
        layout.addLayout(row)
        return self._wrap_page(page)

    def _page_investments(self) -> QScrollArea:
        page, layout = self._page_root()
        action = QPushButton("+ Registrar aporte")
        action.setObjectName("secondaryButton")
        action.clicked.connect(self._new_aporte)
        layout.addWidget(self._page_header("Investimentos", action))
        investments = sorted(
            self.data.investimentos,
            key=lambda item: item.criado_em or datetime.min,
            reverse=True,
        )
        aporte_total = self._sum_amount(self.data.aportes, "valor", lambda item: item.tipo == "aporte")
        resgate_total = self._sum_amount(self.data.aportes, "valor", lambda item: item.tipo == "resgate")
        rendimento_total = self._sum_amount(
            self.data.aportes,
            "valor",
            lambda item: item.tipo == "rendimento",
        )
        total_investido = aporte_total + rendimento_total - resgate_total
        month_start, next_month = self._month_bounds()
        aportado_mes = self._sum_amount(
            self.data.aportes,
            "valor",
            lambda item: item.tipo == "aporte"
            and self._in_date_range(item.data, month_start, next_month),
        )
        metas_atingidas = 0
        progress_rows: list[tuple[Investimento, float]] = []
        for investment in investments:
            total_item = self._investment_total(investment.id)
            progress_rows.append((investment, total_item))
            if investment.meta_valor and investment.meta_valor > 0 and total_item >= investment.meta_valor:
                metas_atingidas += 1
        layout.addWidget(
            self._metrics_grid(
                [
                    self._metric_card("Total investido", self._money(total_investido), "", CORES["blue"]),
                    self._metric_card("Aportado este mes", self._money(aportado_mes), "", CORES["green"]),
                    self._metric_card(
                        "Metas atingidas",
                        f"{metas_atingidas} / {len(progress_rows)}",
                        "",
                        CORES["yellow"],
                    ),
                ],
                3,
            )
        )
        progress, progress_layout = self._section_card("Progresso das metas")
        if progress_rows:
            colors = [CORES["green"], CORES["blue"], CORES["yellow"], CORES["accent"]]
            for index, (investment, current_total) in enumerate(progress_rows):
                title = QWidget()
                title_layout = QHBoxLayout(title)
                title_layout.setContentsMargins(0, 0, 0, 0)
                title_layout.addWidget(QLabel(investment.nome))
                title_layout.addStretch(1)
                if investment.meta_valor:
                    title_layout.addWidget(
                        self._color_text(
                            f"{self._money(current_total)} de {self._money(investment.meta_valor)}",
                            CORES["text2"],
                        )
                    )
                else:
                    title_layout.addWidget(
                        self._color_text(self._money(current_total), CORES["text2"])
                    )
                percent = (
                    min(int((current_total / investment.meta_valor) * 100), 100)
                    if investment.meta_valor and investment.meta_valor > 0
                    else 0
                )
                bar = QProgressBar()
                bar.setValue(percent)
                bar.setFormat("")
                bar.setStyleSheet(
                    f"QProgressBar::chunk {{ background-color: {colors[index % len(colors)]}; border-radius: 4px; }}"
                )
                detail = "Sem meta definida."
                if investment.meta_valor and investment.meta_valor > 0:
                    missing = max(investment.meta_valor - current_total, 0)
                    meta_date = investment.meta_data.strftime("%b %Y") if investment.meta_data else "-"
                    detail = f"{percent}% - faltam {self._money(missing)} - meta: {meta_date}"
                detail_label = QLabel(detail)
                detail_label.setObjectName("mutedText")
                progress_layout.addWidget(title)
                progress_layout.addWidget(bar)
                progress_layout.addWidget(detail_label)
                progress_layout.addSpacing(8)
        else:
            progress_layout.addWidget(QLabel("Nenhum investimento cadastrado ainda."))
            progress_layout.itemAt(progress_layout.count() - 1).widget().setObjectName("subtleText")
        layout.addWidget(progress)
        label = QLabel("APORTES RECENTES")
        label.setObjectName("sectionTitle")
        layout.addWidget(label)
        recent_entries = self._sorted_aportes()
        if recent_entries:
            rows = []
            for entry in recent_entries[:10]:
                investment_name = entry.investimento.nome if entry.investimento else "-"
                prefix = "+" if entry.tipo != "resgate" else "-"
                rows.append(
                    [
                        entry.data.strftime("%d/%m/%y"),
                        investment_name,
                        entry.tipo or "-",
                        f"{prefix}{self._money(entry.valor)}",
                        self._table_actions(
                            [
                                ("X", "Apagar movimento", lambda checked=False, item_id=entry.id: self._delete_aporte(item_id)),
                            ]
                        ),
                    ]
                )
            layout.addWidget(self._table(["DATA", "ATIVO", "TIPO", "VALOR", "ACAO"], rows))
        else:
            layout.addWidget(
                self._empty_card("Aportes recentes", "Nenhum aporte registrado ainda.")
            )
        return self._wrap_page(page)

    def _page_timer(self) -> QScrollArea:
        page, layout = self._page_root()
        start_button = QPushButton("+ Iniciar sessao")
        start_button.setObjectName("secondaryButton")
        start_button.clicked.connect(self._start_timer)
        layout.addWidget(self._page_header("Timer de trabalho", start_button))

        active_session = self._active_session()
        active = QFrame()
        active.setObjectName("activeSessionCard")
        active_layout = QVBoxLayout(active)
        active_layout.setContentsMargins(24, 22, 24, 22)
        active_layout.setSpacing(10)
        section = QLabel("SESSAO ATIVA" if active_session else "SEM SESSAO ATIVA")
        section.setObjectName("sectionTitle")
        section.setAlignment(Qt.AlignmentFlag.AlignCenter)
        if active_session is not None and active_session.projeto is not None:
            project_text = active_session.projeto.titulo
        else:
            project_text = "Inicie um timer num projeto para acompanhar as horas."
        project = QLabel(project_text)
        project.setObjectName("subtleText")
        project.setAlignment(Qt.AlignmentFlag.AlignCenter)
        timer = QLabel(
            self._duration_hms(active_session.inicio, active_session.fim)
            if active_session is not None
            else "--:--:--"
        )
        timer.setObjectName("timerDisplay")
        timer.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.timer_project_label = project
        self.timer_display_label = timer
        actions = QWidget()
        actions_layout = QHBoxLayout(actions)
        actions_layout.setContentsMargins(0, 0, 0, 0)
        actions_layout.setSpacing(12)
        actions_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        pause = QPushButton("▌▌ Pausar")
        pause.setObjectName("warningButton")
        pause.setEnabled(active_session is not None)
        pause.clicked.connect(self._pause_active_session)
        stop = QPushButton("■ Parar e salvar")
        stop.setObjectName("dangerButton")
        stop.setEnabled(active_session is not None)
        stop.clicked.connect(self._stop_active_session)
        self.timer_pause_button = pause
        self.timer_stop_button = stop
        actions_layout.addWidget(pause)
        actions_layout.addWidget(stop)
        active_layout.addWidget(section)
        active_layout.addWidget(project)
        active_layout.addWidget(timer)
        active_layout.addWidget(actions)
        layout.addWidget(active)
        title = QLabel("HORAS POR PROJETO ESTE MES")
        title.setObjectName("sectionTitle")
        layout.addWidget(title)
        month_start, next_month = self._month_bounds()
        month_start_dt = datetime.combine(month_start, datetime.min.time())
        next_month_dt = datetime.combine(next_month, datetime.min.time())
        month_sessions = [
            item
            for item in self.data.tempo_projeto
            if self._in_datetime_range(item.inicio, month_start_dt, next_month_dt)
        ]
        month_sessions.sort(key=lambda item: item.inicio, reverse=True)
        sessions_by_project: dict[str, dict[str, int]] = {}
        for item in month_sessions:
            project_name = item.projeto.titulo if item.projeto else "Projeto removido"
            total_minutes = item.duracao_min
            if total_minutes is None:
                final_time = item.fim or datetime.now()
                total_minutes = max(int((final_time - item.inicio).total_seconds() // 60), 0)
            current = sessions_by_project.setdefault(project_name, {"count": 0, "minutes": 0})
            current["count"] += 1
            current["minutes"] += total_minutes
        if sessions_by_project:
            rows = []
            for project_name, data in sessions_by_project.items():
                rows.append(
                    [
                        project_name,
                        str(data["count"]),
                        self._duration_text(data["minutes"]),
                    ]
                )
            layout.addWidget(
                self._table(
                    ["PROJETO", "SESSOES", "TOTAL HORAS"],
                    rows,
                    220,
                )
            )
        else:
            layout.addWidget(
                self._empty_card("Horas por projeto este mes", "Nenhuma sessao registrada neste mes.")
            )
        footer = QWidget()
        footer_layout = QHBoxLayout(footer)
        footer_layout.setContentsMargins(0, 0, 0, 0)
        footer_layout.setSpacing(10)
        manual = QPushButton("+ Sessao manual")
        manual.setObjectName("secondaryButton")
        manual.clicked.connect(self._new_manual_session)
        export = QPushButton("📥 Exportar horas (.xlsx)")
        export.setObjectName("secondaryButton")
        export.clicked.connect(self._export_hours)
        footer_layout.addWidget(manual)
        footer_layout.addWidget(export)
        footer_layout.addStretch(1)
        layout.addWidget(footer)
        return self._wrap_page(page)

    def _page_chat(self) -> QScrollArea:
        page, layout = self._page_root()
        actions = QWidget()
        actions_layout = QHBoxLayout(actions)
        actions_layout.setContentsMargins(0, 0, 0, 0)
        actions_layout.setSpacing(8)
        clear_button = QPushButton("Limpar chat")
        clear_button.setObjectName("secondaryButton")
        clear_button.clicked.connect(self._clear_chat)
        actions_layout.addWidget(clear_button)
        layout.addWidget(self._page_header("Chat", actions))

        feed, feed_layout = self._section_card("Mensagens")
        if self.data.chat_mensagens:
            for mensagem in self.data.chat_mensagens[-50:]:
                row = QFrame()
                row.setObjectName("sectionCard")
                row_layout = QVBoxLayout(row)
                row_layout.setContentsMargins(10, 10, 10, 10)
                row_layout.setSpacing(4)
                header = QLabel(
                    f"{mensagem.autor} - {mensagem.criado_em.strftime('%d/%m/%Y %H:%M')}"
                )
                header.setObjectName("sectionTitle")
                body = QLabel(mensagem.texto)
                body.setWordWrap(True)
                row_layout.addWidget(header)
                row_layout.addWidget(body)
                feed_layout.addWidget(row)
        else:
            feed_layout.addWidget(QLabel("Nenhuma mensagem ainda."))
            feed_layout.itemAt(feed_layout.count() - 1).widget().setObjectName("subtleText")
        layout.addWidget(feed)

        composer = QFrame()
        composer.setObjectName("sectionCard")
        composer_layout = QVBoxLayout(composer)
        composer_layout.setContentsMargins(12, 12, 12, 12)
        composer_layout.setSpacing(8)
        self.chat_input = QPlainTextEdit()
        self.chat_input.setPlaceholderText("Escreva uma mensagem...")
        self.chat_input.setMaximumHeight(120)
        send_button = QPushButton("Enviar")
        send_button.setObjectName("primaryButton")
        send_button.clicked.connect(self._send_chat_message)
        composer_layout.addWidget(self.chat_input)
        composer_layout.addWidget(send_button, 0, Qt.AlignmentFlag.AlignRight)
        layout.addWidget(composer)
        return self._wrap_page(page)

    def _page_settings(self) -> QScrollArea:
        page, layout = self._page_root()
        save = QPushButton("Salvar configuracoes")
        save.setObjectName("primaryButton")
        save.clicked.connect(self._save_settings)
        layout.addWidget(self._page_header("Configuracoes", save))

        row = QHBoxLayout()
        row.setSpacing(12)

        form_card = QFrame()
        form_card.setObjectName("settingsCard")
        form = QFormLayout(form_card)
        form.setContentsMargins(18, 18, 18, 18)
        form.setSpacing(14)

        self.settings_name_input = QLineEdit(self.configuracoes.get("nome_usuario", ""))

        backup_row = QWidget()
        backup_layout = QHBoxLayout(backup_row)
        backup_layout.setContentsMargins(0, 0, 0, 0)
        backup_layout.setSpacing(8)
        self.settings_backup_input = QLineEdit(self.configuracoes.get("caminho_backup", ""))
        browse = QPushButton("Escolher")
        browse.setObjectName("secondaryButton")
        browse.clicked.connect(self._select_backup_folder)
        backup_layout.addWidget(self.settings_backup_input, 1)
        backup_layout.addWidget(browse)

        self.settings_currency_input = QComboBox()
        for label, code in MOEDA_OPCOES:
            self.settings_currency_input.addItem(label, code)
        index = self.settings_currency_input.findData(self.configuracoes.get("moeda", "CVE"))
        self.settings_currency_input.setCurrentIndex(max(index, 0))
        self.settings_currency_input.currentIndexChanged.connect(self._update_currency_preview)

        self.settings_deadline_input = QLineEdit(self.configuracoes.get("alerta_prazo_dias", "7"))
        self.settings_bill_input = QLineEdit(self.configuracoes.get("alerta_conta_dias", "3"))
        form.addRow("Nome", self.settings_name_input)
        form.addRow("Moeda", self.settings_currency_input)
        form.addRow("Pasta de backup", backup_row)
        form.addRow("Dias para prazo", self.settings_deadline_input)
        form.addRow("Dias para contas", self.settings_bill_input)

        preview, preview_layout = self._section_card("Preview")
        preview_layout.addWidget(QLabel("Exemplo de valor principal"))
        self.currency_preview = QLabel()
        self.currency_preview.setObjectName("metricValue")
        preview_layout.addWidget(self.currency_preview)
        preview_layout.addWidget(QLabel("Tema ativo: preto"))
        preview_layout.addWidget(QLabel("Sidebar compacta, conteudo preto e bordas discretas"))
        preview_layout.addStretch(1)
        self._update_currency_preview()

        row.addWidget(form_card, 2)
        row.addWidget(preview, 1)
        layout.addLayout(row)
        return self._wrap_page(page)

    def _set_project_search(self, text: str) -> None:
        self.project_search_term = text
        self._rebuild_pages()
        self.switch_page("projetos")

    def _update_project_search_term(self, text: str) -> None:
        self.project_search_term = text

    def _set_project_status_filter(self, text: str) -> None:
        self.project_status_filter = text
        self._rebuild_pages()
        self.switch_page("projetos")

    def _set_finance_month_index(self, index: int) -> None:
        self.finance_month_offset = max(index, 0)
        self._rebuild_pages()
        self.switch_page("financas")

    def _show_alerts(self) -> None:
        AlertsDialog(self._current_alerts(), self).exec()

    def _new_project(self) -> None:
        dialog = ProjectDialog(parent=self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.create_projeto(**values))

    def _edit_project(self, project_id: int) -> None:
        projeto = next((item for item in self.data.projetos if item.id == project_id), None)
        if projeto is None:
            self._show_operation_error(ValueError("Projeto nao encontrado."))
            return
        dialog = ProjectDialog(projeto=projeto, parent=self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.update_projeto(project_id, **values))

    def _delete_project(self, project_id: int) -> None:
        answer = QMessageBox.question(
            self,
            "Apagar projeto",
            "Deseja apagar o projeto e os seus pagamentos, receitas e sessoes?",
        )
        if answer != QMessageBox.StandardButton.Yes:
            return
        self._run_action(lambda: self.repository.delete_projeto(project_id))

    def _register_payment(self, project_id: int) -> None:
        dialog = PaymentDialog(self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.registrar_pagamento(project_id, **values))

    def _new_gasto(self) -> None:
        dialog = FinanceEntryDialog("gasto", parent=self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.create_gasto(**values))

    def _new_receita(self) -> None:
        dialog = FinanceEntryDialog("receita", projetos=self.data.projetos, parent=self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.create_receita(**values))

    def _new_aporte(self) -> None:
        dialog = InvestmentAporteDialog(self.data.investimentos, self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.registrar_aporte(**values))

    def _delete_aporte(self, aporte_id: int) -> None:
        answer = QMessageBox.question(
            self,
            "Apagar movimento",
            "Deseja apagar este aporte/resgate?",
        )
        if answer != QMessageBox.StandardButton.Yes:
            return
        self._run_action(lambda: self.repository.delete_aporte(aporte_id))

    def _start_timer(self) -> None:
        dialog = StartSessionDialog(self._sorted_projects(), self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.iniciar_sessao(**values))
        self.switch_page("timer")

    def _pause_active_session(self) -> None:
        self._run_action(
            lambda: self.repository.parar_sessao_ativa("Sessao pausada"),
            success_message="Sessao pausada.",
        )
        self.switch_page("timer")

    def _stop_active_session(self) -> None:
        if self._active_session() is None:
            return
        dialog = StopSessionDialog(self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(
            lambda: self.repository.parar_sessao_ativa(values.get("descricao")),  # type: ignore[arg-type]
            success_message="Sessao finalizada.",
        )
        self.switch_page("timer")

    def _new_manual_session(self) -> None:
        dialog = ManualSessionDialog(self._sorted_projects(), self)
        if dialog.exec() == 0:
            return
        values = dialog.values()
        self._run_action(lambda: self.repository.criar_sessao_manual(**values))
        self.switch_page("timer")

    def _export_hours(self) -> None:
        if not self.data.tempo_projeto:
            QMessageBox.information(self, "Sem dados", "Nao ha sessoes para exportar.")
            return
        default_dir = self.configuracoes.get("caminho_backup", str(Path.home()))
        default_name = Path(default_dir) / f"devflow-horas-{datetime.now():%Y%m%d-%H%M%S}.xlsx"
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Exportar horas",
            str(default_name),
            "Excel (*.xlsx)",
        )
        if not file_path:
            return
        try:
            exportar_sessoes_para_excel(self.data.tempo_projeto, Path(file_path))
        except Exception as exc:
            self._show_operation_error(exc, "Falha ao exportar")
            return
        QMessageBox.information(self, "Exportacao concluida", f"Arquivo criado em:\n{file_path}")

    def _send_chat_message(self) -> None:
        if self.chat_input is None:
            return
        text = self.chat_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Mensagem vazia", "Escreva uma mensagem antes de enviar.")
            return
        autor = self.configuracoes.get("nome_usuario", "Usuario")
        self._run_action(lambda: self.repository.append_chat_mensagem(autor, text))
        self.switch_page("chat")

    def _clear_chat(self) -> None:
        answer = QMessageBox.question(
            self,
            "Limpar chat",
            "Deseja apagar todo o historico do chat?",
        )
        if answer != QMessageBox.StandardButton.Yes:
            return
        self._run_action(lambda: self.repository.clear_chat_mensagens())
        self.switch_page("chat")

    def _update_currency_preview(self) -> None:
        if hasattr(self, "currency_preview"):
            moeda = self.settings_currency_input.currentData()
            self.currency_preview.setText(formatar_moeda(12500, moeda))

    def _select_backup_folder(self) -> None:
        current = self.settings_backup_input.text().strip() or str(Path.home())
        chosen = QFileDialog.getExistingDirectory(self, "Selecionar pasta de backup", current)
        if chosen:
            self.settings_backup_input.setText(chosen)

    def _save_settings(self) -> None:
        nome = self.settings_name_input.text().strip()
        backup_path = self.settings_backup_input.text().strip()
        prazo = self.settings_deadline_input.text().strip() or "7"
        contas = self.settings_bill_input.text().strip() or "3"

        if not nome:
            QMessageBox.warning(self, "Campo obrigatorio", "Informe o nome do usuario.")
            return
        if not backup_path:
            QMessageBox.warning(self, "Campo obrigatorio", "Informe a pasta de backup.")
            return
        if not prazo.isdigit() or not contas.isdigit():
            QMessageBox.warning(
                self, "Valor invalido", "Dias de alerta devem ser numeros inteiros positivos."
            )
            return

        try:
            Path(backup_path).mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            QMessageBox.warning(self, "Pasta invalida", f"Nao foi possivel usar a pasta: {exc}")
            return

        payload = {
            **DEFAULT_CONFIG,
            **self.configuracoes,
            "nome_usuario": nome,
            "moeda": self.settings_currency_input.currentData(),
            "caminho_backup": backup_path,
            "alerta_prazo_dias": prazo,
            "alerta_conta_dias": contas,
        }
        self.configuracoes = {
            **DEFAULT_CONFIG,
            **self.repository.save_configuracoes(payload),
        }
        self._refresh_footer()
        self._rebuild_pages()
        QMessageBox.information(self, "Configuracoes salvas", "As configuracoes foram atualizadas.")

    def closeEvent(self, event: QCloseEvent) -> None:
        super().closeEvent(event)
