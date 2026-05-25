from __future__ import annotations

from datetime import date, datetime, timedelta

from database.models import Aporte, Gasto, Projeto
from ui.theme import CORES
from utils.formatacao import cor_prazo, formatar_moeda, percentual


def format_money(value: float, moeda: str) -> str:
    return formatar_moeda(value, moeda)


def display_status(raw_status: str | None) -> str:
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


def display_date(raw_date: date | None) -> str:
    if raw_date is None:
        return "-"
    return raw_date.strftime("%d/%m")


def display_datetime(raw_datetime: datetime | None) -> str:
    if raw_datetime is None:
        return "-"
    return raw_datetime.strftime("%d/%m/%Y %H:%M")


def duration_text(total_minutes: int) -> str:
    hours, minutes = divmod(max(total_minutes, 0), 60)
    if hours == 0:
        return f"{minutes}min"
    return f"{hours}h {minutes:02d}min"


def duration_hms(start: datetime, end: datetime | None = None) -> str:
    final = end or datetime.now()
    total_seconds = max(int((final - start).total_seconds()), 0)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def month_bounds(reference: date | None = None) -> tuple[date, date]:
    current = reference or date.today()
    month_start = current.replace(day=1)
    if month_start.month == 12:
        next_month = date(month_start.year + 1, 1, 1)
    else:
        next_month = date(month_start.year, month_start.month + 1, 1)
    return month_start, next_month


def shift_month(reference: date, offset: int) -> date:
    month_index = (reference.year * 12 + reference.month - 1) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def sum_amount(items: list[object], attribute: str, predicate=None) -> float:
    total = 0.0
    for item in items:
        if predicate is not None and not predicate(item):
            continue
        total += float(getattr(item, attribute, 0) or 0)
    return total


def count_items(items: list[object], predicate=None) -> int:
    if predicate is None:
        return len(items)
    return sum(1 for item in items if predicate(item))


def project_due(project: Projeto) -> float:
    return max(float(project.valor_total or 0) - float(project.valor_pago or 0), 0.0)


def is_open_project(project: Projeto) -> bool:
    return project.status not in {"concluido", "cancelado", "pago"}


def in_date_range(value: date | None, start: date, end: date) -> bool:
    return value is not None and start <= value < end


def in_datetime_range(value: datetime | None, start: datetime, end: datetime) -> bool:
    return value is not None and start <= value < end


def sorted_projects(projetos: list[Projeto]) -> list[Projeto]:
    return sorted(
        projetos,
        key=lambda item: item.criado_em or datetime.min,
        reverse=True,
    )


def sorted_projects_by_deadline(projetos: list[Projeto]) -> list[Projeto]:
    return sorted(
        projetos,
        key=lambda item: (item.prazo is None, item.prazo or date.max),
    )


def sorted_gastos(gastos: list[Gasto], recurring_only: bool = False) -> list[Gasto]:
    items = gastos
    if recurring_only:
        items = [item for item in items if item.recorrente > 0]
    return sorted(
        items,
        key=lambda item: (item.data, item.valor, item.criado_em or datetime.min),
        reverse=True,
    )


def sorted_receitas(receitas: list) -> list:
    return sorted(
        receitas,
        key=lambda item: (item.data, item.valor, item.criado_em or datetime.min),
        reverse=True,
    )


def sorted_aportes(aportes: list[Aporte]) -> list[Aporte]:
    return sorted(
        aportes,
        key=lambda item: (item.data, item.criado_em or datetime.min),
        reverse=True,
    )


def investment_total(investment_id: int, aportes: list[Aporte]) -> float:
    total = 0.0
    for item in aportes:
        if item.investimento_id != investment_id:
            continue
        if item.tipo == "resgate":
            total -= float(item.valor or 0)
        else:
            total += float(item.valor or 0)
    return total


def monthly_category_totals(gastos: list[Gasto], start: date, end: date) -> list[tuple[str, str, float]]:
    aggregates: dict[str, dict[str, object]] = {}
    for item in gastos:
        if not in_date_range(item.data, start, end):
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


def current_alerts(
    projetos: list[Projeto],
    gastos: list[Gasto],
    configuracoes: dict[str, str],
    moeda: str,
) -> list[tuple[str, bool]]:
    alerts: list[tuple[str, bool]] = []
    today = date.today()
    prazo_days = int(configuracoes.get("alerta_prazo_dias", "7"))
    conta_days = int(configuracoes.get("alerta_conta_dias", "3"))

    upcoming_projects = [
        project
        for project in sorted_projects_by_deadline(projetos)
        if project.prazo is not None
        and today <= project.prazo <= today + timedelta(days=prazo_days)
        and is_open_project(project)
    ]
    for project in upcoming_projects:
        client_name = project.cliente.nome if project.cliente else "Cliente"
        missing = project_due(project)
        days_left = max((project.prazo - today).days if project.prazo else 0, 0)
        alerts.append(
            (
                f"{project.titulo} ({client_name}): {format_money(missing, moeda)} pendente, prazo em {days_left} dias",
                False,
            )
        )

    overdue_projects = [
        project
        for project in sorted_projects_by_deadline(projetos)
        if project.prazo is not None
        and project.prazo < today
        and project_due(project) > 0
        and is_open_project(project)
    ]
    for project in overdue_projects:
        client_name = project.cliente.nome if project.cliente else "Cliente"
        missing = project_due(project)
        alerts.append(
            (
                f"{project.titulo} ({client_name}): {format_money(missing, moeda)} em atraso desde {display_date(project.prazo)}",
                True,
            )
        )

    pending_bills = sorted(
        [
            bill
            for bill in gastos
            if bill.pago == 0 and bill.data <= today + timedelta(days=conta_days)
        ],
        key=lambda item: item.data,
    )
    for bill in pending_bills:
        alerts.append(
            (
                f"{bill.descricao}: {format_money(bill.valor, moeda)} pendente para {display_date(bill.data)}",
                False,
            )
        )

    return alerts
