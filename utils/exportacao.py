from __future__ import annotations

from datetime import date, datetime
from pathlib import Path

import pandas as pd

from database.models import Aporte, Gasto, Investimento, Projeto, Receita, TempoProjeto


def _garantir_diretorio(destino: Path) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)


def exportar_sessoes_para_excel(sessoes: list[TempoProjeto], destino: Path) -> Path:
    _garantir_diretorio(destino)

    rows: list[dict[str, object]] = []
    for sessao in sessoes:
        fim = sessao.fim
        duracao = sessao.duracao_min
        if duracao is None and fim is not None:
            duracao = max(int((fim - sessao.inicio).total_seconds() // 60), 0)
        rows.append(
            {
                "Projeto": sessao.projeto.titulo if sessao.projeto else "-",
                "Inicio": sessao.inicio.strftime("%d/%m/%Y %H:%M"),
                "Fim": fim.strftime("%d/%m/%Y %H:%M") if fim else "",
                "Duracao (min)": duracao or 0,
                "Descricao": sessao.descricao or "",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Sessoes")
        _formatar_planilha(writer, "Sessoes", len(dataframe.columns))
    return destino


def exportar_receitas_para_excel(receitas: list[Receita], destino: Path) -> Path:
    _garantir_diretorio(destino)

    rows: list[dict[str, object]] = []
    for item in receitas:
        rows.append(
            {
                "Data": item.data.strftime("%d/%m/%Y") if isinstance(item.data, date) else str(item.data),
                "Descricao": item.descricao,
                "Valor": float(item.valor or 0),
                "Origem": item.origem or "",
                "Projeto": item.projeto.titulo if item.projeto else "",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Receitas")
        _formatar_planilha(writer, "Receitas", len(dataframe.columns))
    return destino


def exportar_gastos_para_excel(gastos: list[Gasto], destino: Path) -> Path:
    _garantir_diretorio(destino)

    rows: list[dict[str, object]] = []
    for item in gastos:
        rows.append(
            {
                "Data": item.data.strftime("%d/%m/%Y") if isinstance(item.data, date) else str(item.data),
                "Descricao": item.descricao,
                "Categoria": item.categoria_nome or "Sem categoria",
                "Valor": float(item.valor or 0),
                "Metodo": item.metodo or "",
                "Pago": "Sim" if item.pago == 1 else "Nao",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Gastos")
        _formatar_planilha(writer, "Gastos", len(dataframe.columns))
    return destino


def exportar_projetos_para_excel(projetos: list[Projeto], destino: Path) -> Path:
    _garantir_diretorio(destino)

    rows: list[dict[str, object]] = []
    for item in projetos:
        cliente_nome = item.cliente.nome if item.cliente else "Sem cliente"
        valor_total = float(item.valor_total or 0)
        valor_pago = float(item.valor_pago or 0)
        em_aberto = max(valor_total - valor_pago, 0)
        rows.append(
            {
                "Cliente": cliente_nome,
                "Projeto": item.titulo,
                "Tipo": item.tipo or "",
                "Status": item.status or "pendente",
                "Valor total": valor_total,
                "Valor pago": valor_pago,
                "Em aberto": em_aberto,
                "Prazo": item.prazo.strftime("%d/%m/%Y") if item.prazo else "",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Projetos")
        _formatar_planilha(writer, "Projetos", len(dataframe.columns))
    return destino


def exportar_investimentos_para_excel(
    investimentos: list[Investimento],
    aportes: list[Aporte],
    destino: Path,
) -> Path:
    _garantir_diretorio(destino)

    def total_investido(inv_id: int) -> float:
        total = 0.0
        for ap in aportes:
            if ap.investimento_id != inv_id:
                continue
            if ap.tipo == "resgate":
                total -= float(ap.valor or 0)
            else:
                total += float(ap.valor or 0)
        return total

    rows: list[dict[str, object]] = []
    for item in investimentos:
        rows.append(
            {
                "Nome": item.nome,
                "Tipo": item.tipo,
                "Ativo": "Sim" if item.ativo == 1 else "Nao",
                "Total investido": total_investido(item.id),
                "Meta valor": float(item.meta_valor or 0),
                "Meta data": item.meta_data.strftime("%d/%m/%Y") if item.meta_data else "",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Investimentos")
        _formatar_planilha(writer, "Investimentos", len(dataframe.columns))
    return destino


def exportar_aportes_para_excel(aportes: list[Aporte], destino: Path) -> Path:
    _garantir_diretorio(destino)

    rows: list[dict[str, object]] = []
    for item in aportes:
        rows.append(
            {
                "Data": item.data.strftime("%d/%m/%Y") if isinstance(item.data, date) else str(item.data),
                "Investimento": item.investimento.nome if item.investimento else "",
                "Tipo": item.tipo or "aporte",
                "Valor": float(item.valor or 0),
                "Notas": item.notas or "",
            }
        )

    dataframe = pd.DataFrame(rows)
    with pd.ExcelWriter(destino, engine="openpyxl") as writer:
        dataframe.to_excel(writer, index=False, sheet_name="Aportes")
        _formatar_planilha(writer, "Aportes", len(dataframe.columns))
    return destino


def _formatar_planilha(
    writer: pd.ExcelWriter,
    sheet_name: str,
    num_colunas: int,
) -> None:
    worksheet = writer.sheets[sheet_name]
    for column in worksheet.columns:
        max_length = 0
        for cell in column:
            if cell.value:
                max_length = max(max_length, len(str(cell.value)))
        column.column_dimensions.width = min(max(max_length + 3, 10), 45)
