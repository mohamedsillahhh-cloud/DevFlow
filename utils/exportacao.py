from __future__ import annotations

from pathlib import Path

import pandas as pd

from database.models import TempoProjeto


def exportar_sessoes_para_excel(sessoes: list[TempoProjeto], destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)

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
    dataframe.to_excel(destino, index=False)
    return destino
