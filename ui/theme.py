from __future__ import annotations

APP_VERSION = "v1.0.0"
FONT = "Segoe UI"
CORES = {
    "bg": "#000000",
    "bg2": "#0D0D0D",
    "bg3": "#111111",
    "bg4": "#1A1A1A",
    "border": "#222222",
    "accent": "#E94560",
    "green": "#1D9E75",
    "yellow": "#EF9F27",
    "blue": "#378ADD",
    "red": "#E24B4A",
    "text": "#F0F0F0",
    "text2": "#888888",
    "text3": "#444444",
}
MOEDA_OPCOES = (
    ("Escudo cabo-verdiano (CVE)", "CVE"),
    ("Real brasileiro (BRL)", "BRL"),
    ("Dolar americano (USD)", "USD"),
    ("Euro (EUR)", "EUR"),
)
DEFAULT_CONFIG = {
    "moeda": "CVE",
    "tema": "preto",
    "alerta_prazo_dias": "7",
    "alerta_conta_dias": "3",
    "ultimo_backup": "nunca",
}

APP_STYLESHEET = f"""
QMainWindow, QWidget {{
    background-color: {CORES["bg"]};
    color: {CORES["text"]};
    font-family: "{FONT}";
    font-size: 13px;
}}
QWidget#appShell {{
    background-color: {CORES["bg"]};
    border: 1px solid {CORES["border"]};
    border-radius: 10px;
}}
QFrame#titleBar {{
    background-color: {CORES["bg"]};
    border-bottom: 1px solid {CORES["border"]};
}}
QWidget#sidebar {{
    background-color: {CORES["bg"]};
    border-right: 1px solid {CORES["border"]};
}}
QWidget#contentHost, QScrollArea, QScrollArea > QWidget > QWidget {{
    background-color: {CORES["bg"]};
}}
QPushButton {{
    background-color: {CORES["bg2"]};
    color: {CORES["text"]};
    border: 1px solid {CORES["border"]};
    border-radius: 6px;
    padding: 6px 12px;
}}
QPushButton:hover {{
    background-color: {CORES["bg3"]};
}}
QPushButton#primaryButton {{
    background-color: {CORES["accent"]};
    border: none;
    color: white;
    font-weight: 600;
}}
QPushButton#primaryButton:hover {{
    background-color: #d63d59;
}}
QPushButton#secondaryButton {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    color: {CORES["text"]};
}}
QPushButton#warningButton {{
    background-color: #120d00;
    border: 1px solid #3d2800;
    color: {CORES["yellow"]};
}}
QPushButton#dangerButton {{
    background-color: #140000;
    border: 1px solid #3d0000;
    color: {CORES["red"]};
}}
QPushButton#statusStopButton {{
    background-color: transparent;
    border: 1px solid #3d0000;
    color: {CORES["red"]};
    border-radius: 10px;
    font-size: 11px;
    padding: 3px 12px;
}}
QPushButton#navButton {{
    background-color: transparent;
    border: none;
    border-radius: 8px;
    color: {CORES["text3"]};
    font-size: 16px;
    padding: 0px;
}}
QPushButton#navButton:hover {{
    background-color: {CORES["bg3"]};
    color: {CORES["text2"]};
}}
QPushButton#navButton:checked {{
    background-color: {CORES["accent"]};
    color: white;
}}
QPushButton#alertButton {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    border-radius: 8px;
    color: {CORES["yellow"]};
    font-size: 11px;
    padding: 6px 10px;
}}
QPushButton#gearButton {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    border-radius: 8px;
    color: {CORES["text2"]};
    font-size: 12px;
    min-width: 30px;
    max-width: 30px;
    min-height: 28px;
    max-height: 28px;
    padding: 0px;
}}
QPushButton#circleControl {{
    border: none;
    border-radius: 5px;
    min-width: 11px;
    max-width: 11px;
    min-height: 11px;
    max-height: 11px;
    padding: 0px;
}}
QPushButton#circleControl:hover {{
    border: 1px solid rgba(255, 255, 255, 0.20);
}}
QFrame#metricCard, QFrame#sectionCard, QFrame#activeSessionCard, QFrame#settingsCard {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    border-radius: 8px;
}}
QFrame#alertCard {{
    background-color: #0a0500;
    border: 1px solid #3d2800;
    border-radius: 8px;
}}
QFrame#alertCardDanger {{
    background-color: #0a0000;
    border: 1px solid #3d0000;
    border-radius: 8px;
}}
QLabel#pageTitle {{
    font-size: 18px;
    font-weight: 600;
    color: white;
}}
QLabel#sectionTitle {{
    font-size: 11px;
    text-transform: uppercase;
    color: {CORES["text2"]};
}}
QLabel#metricLabel {{
    font-size: 11px;
    color: {CORES["text2"]};
}}
QLabel#metricValue {{
    font-size: 20px;
    font-weight: 500;
    color: {CORES["text"]};
}}
QLabel#metricSubtitle {{
    font-size: 11px;
    color: {CORES["text3"]};
}}
QLabel#subtleText {{
    color: {CORES["text2"]};
}}
QLabel#mutedText {{
    color: {CORES["text3"]};
}}
QLabel#timerDisplay {{
    font-size: 44px;
    font-weight: 500;
    color: {CORES["green"]};
}}
QLabel#titleBarText {{
    color: {CORES["text2"]};
    font-size: 13px;
}}
QLineEdit, QComboBox {{
    background-color: {CORES["bg3"]};
    border: 1px solid {CORES["border"]};
    border-radius: 6px;
    color: {CORES["text"]};
    padding: 7px 10px;
    min-height: 18px;
}}
QLineEdit:focus, QComboBox:focus {{
    border: 1px solid {CORES["accent"]};
}}
QComboBox::drop-down {{
    border: none;
    width: 22px;
}}
QComboBox QAbstractItemView {{
    background-color: {CORES["bg2"]};
    color: {CORES["text"]};
    border: 1px solid {CORES["border"]};
    selection-background-color: {CORES["bg3"]};
}}
QScrollArea {{
    border: none;
}}
QScrollBar:vertical {{
    background: {CORES["bg"]};
    width: 8px;
    margin: 4px;
}}
QScrollBar::handle:vertical {{
    background: {CORES["border"]};
    border-radius: 4px;
    min-height: 30px;
}}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0px;
}}
QTableWidget {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    border-radius: 8px;
    gridline-color: transparent;
}}
QTableWidget::item {{
    border-bottom: 1px solid {CORES["border"]};
    padding: 8px 10px;
}}
QTableWidget::item:hover {{
    background-color: {CORES["bg3"]};
}}
QHeaderView::section {{
    background-color: {CORES["bg3"]};
    color: {CORES["text2"]};
    border: none;
    border-bottom: 1px solid {CORES["border"]};
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}}
QProgressBar {{
    background-color: {CORES["bg4"]};
    border: none;
    border-radius: 4px;
    text-align: right;
    color: {CORES["text2"]};
    height: 8px;
}}
QStatusBar {{
    background-color: {CORES["bg"]};
    border-top: 1px solid {CORES["border"]};
    min-height: 30px;
    max-height: 30px;
}}
QDialog {{
    background-color: {CORES["bg2"]};
    border: 1px solid {CORES["border"]};
    border-radius: 12px;
}}
QDialogButtonBox {{
    border-top: 1px solid {CORES["border"]};
    padding-top: 12px;
}}
"""
