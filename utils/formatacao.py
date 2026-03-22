from __future__ import annotations

from datetime import date


def formatar_moeda(valor: float, moeda: str = "BRL") -> str:
    """Formata valores monetarios no padrao visual esperado."""

    simbolos = {
        "BRL": "R$",
        "CVE": "CVE",
        "USD": "$",
        "EUR": "EUR",
    }
    simbolo = simbolos.get(moeda.upper(), moeda.upper())
    valor_formatado = f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{simbolo} {valor_formatado}"


def cor_prazo(prazo: date | None) -> str:
    """Retorna uma cor conforme a urgencia do prazo."""

    if prazo is None:
        return "#378ADD"

    dias = (prazo - date.today()).days
    if dias < 0:
        return "#E24B4A"
    if dias <= 3:
        return "#E94560"
    if dias <= 7:
        return "#EF9F27"
    return "#1D9E75"


def percentual(valor_pago: float, valor_total: float) -> str:
    """Calcula percentual de pagamento com arredondamento simples."""

    if valor_total == 0:
        return "0%"

    return f"{(valor_pago / valor_total * 100):.0f}%"
