from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any
from unicodedata import normalize

from supabase import Client

from .connection import get_client
from .models import (
    AppSnapshot,
    Aporte,
    CategoriaGasto,
    ChatMensagem,
    Cliente,
    Configuracao,
    Gasto,
    Investimento,
    Pagamento,
    Projeto,
    Receita,
    TempoProjeto,
)

CATEGORY_STYLES: dict[str, tuple[str, str | None]] = {
    "moradia": ("#E24B4A", "home"),
    "alimentacao": ("#EF9F27", "food"),
    "contas": ("#378ADD", "bill"),
    "internet": ("#378ADD", "wifi"),
    "luz": ("#378ADD", "bolt"),
    "agua": ("#378ADD", "drop"),
    "transporte": ("#1D9E75", "car"),
    "saude": ("#D94F70", "health"),
    "lazer": ("#888780", "fun"),
    "ferramentas/saas": ("#8D5CF6", "tool"),
    "assinaturas": ("#5A7D9A", "card"),
    "educacao": ("#4AA3A2", "book"),
    "roupas": ("#B8627C", "shirt"),
    "outros": ("#444444", "more"),
}


def _normalize_key(value: str | None) -> str:
    raw = normalize("NFKD", value or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(raw.lower().strip().split())


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    return date.fromisoformat(str(value)[:10])


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def _parse_float(value: Any, default: float = 0.0) -> float:
    if value in (None, ""):
        return default
    return float(value)


def _parse_int(value: Any, default: int = 0) -> int:
    if value in (None, ""):
        return default
    return int(value)


def _relation_payload(payload: Any) -> dict[str, Any] | None:
    if isinstance(payload, list):
        return payload[0] if payload else None
    if isinstance(payload, dict):
        return payload
    return None


def _serialize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def _clean_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return {key: _serialize_value(value) for key, value in payload.items() if value is not None}


def category_for_name(name: str | None) -> CategoriaGasto | None:
    if not name:
        return None
    key = _normalize_key(name)
    color, icon = CATEGORY_STYLES.get(key, ("#444444", None))
    return CategoriaGasto(nome=name, cor=color, icone=icon)


class SupabaseRepository:
    CHAT_KEY = "chat_history"

    def __init__(self, client: Client | None = None) -> None:
        self.client = client or get_client()

    def check_connection(self) -> None:
        self.client.table("configuracoes").select("chave").limit(1).execute()

    def load_configuracoes(self) -> dict[str, str]:
        response = self.client.table("configuracoes").select("chave,valor").execute()
        rows = response.data or []
        return {str(row["chave"]): str(row.get("valor", "")) for row in rows}

    def save_configuracoes(self, values: dict[str, str]) -> dict[str, str]:
        payload = [{"chave": chave, "valor": str(valor)} for chave, valor in values.items()]
        if payload:
            self.client.table("configuracoes").upsert(payload, on_conflict="chave").execute()
        return self.load_configuracoes()

    def get_configuracao(self, chave: str, default: str = "") -> str:
        response = (
            self.client.table("configuracoes")
            .select("valor")
            .eq("chave", chave)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return default
        return str(rows[0].get("valor", default))

    def set_configuracao(self, chave: str, valor: str) -> None:
        self.client.table("configuracoes").upsert(
            [{"chave": chave, "valor": valor}],
            on_conflict="chave",
        ).execute()

    def load_chat_mensagens(self) -> list[ChatMensagem]:
        raw = self.get_configuracao(self.CHAT_KEY, "[]")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = []

        mensagens: list[ChatMensagem] = []
        for item in payload:
            if not isinstance(item, dict):
                continue
            texto = str(item.get("texto") or "").strip()
            if not texto:
                continue
            mensagens.append(
                ChatMensagem(
                    autor=str(item.get("autor") or "Sistema"),
                    texto=texto,
                    criado_em=_parse_datetime(item.get("criado_em")) or datetime.now(),
                )
            )
        return sorted(mensagens, key=lambda item: item.criado_em)

    def append_chat_mensagem(self, autor: str, texto: str) -> list[ChatMensagem]:
        mensagens = [
            {
                "autor": item.autor,
                "texto": item.texto,
                "criado_em": item.criado_em.isoformat(),
            }
            for item in self.load_chat_mensagens()
        ]
        mensagens.append(
            {
                "autor": autor.strip() or "Usuario",
                "texto": texto.strip(),
                "criado_em": datetime.now().isoformat(),
            }
        )
        self.set_configuracao(self.CHAT_KEY, json.dumps(mensagens, ensure_ascii=True))
        return self.load_chat_mensagens()

    def clear_chat_mensagens(self) -> None:
        self.set_configuracao(self.CHAT_KEY, "[]")

    def get_projeto(self, projeto_id: int) -> Projeto | None:
        response = (
            self.client.table("projetos")
            .select("*, clientes(*)")
            .eq("id", projeto_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            return None
        row = rows[0]
        nested_client = _relation_payload(row.get("clientes"))
        cliente = self._map_cliente(nested_client) if nested_client else None
        return self._map_projeto(row, cliente)

    def get_investimento(self, investimento_id: int) -> Investimento | None:
        response = (
            self.client.table("investimentos")
            .select("*")
            .eq("id", investimento_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return self._map_investimento(rows[0]) if rows else None

    def get_sessao_ativa(self) -> TempoProjeto | None:
        snapshot = self.load_snapshot()
        active_sessions = [item for item in snapshot.tempo_projeto if item.fim is None]
        if not active_sessions:
            return None
        return max(active_sessions, key=lambda item: item.inicio)

    def create_or_get_cliente(
        self,
        nome: str,
        email: str | None = None,
        telefone: str | None = None,
        empresa: str | None = None,
        tipo: str | None = None,
        notas: str | None = None,
    ) -> Cliente:
        client_name = nome.strip()
        if not client_name:
            raise ValueError("Informe o nome do cliente.")

        response = self.client.table("clientes").select("*").eq("nome", client_name).limit(1).execute()
        rows = response.data or []
        if rows:
            return self._map_cliente(rows[0])  # type: ignore[return-value]

        payload = _clean_payload(
            {
                "nome": client_name,
                "email": email,
                "telefone": telefone,
                "empresa": empresa,
                "tipo": tipo,
                "notas": notas,
            }
        )
        created = self.client.table("clientes").insert(payload).execute().data or []
        return self._map_cliente(created[0])  # type: ignore[return-value]

    def create_projeto(
        self,
        cliente_nome: str,
        titulo: str,
        descricao: str | None = None,
        tipo: str | None = None,
        valor_total: float = 0.0,
        status: str = "pendente",
        prazo: date | None = None,
        repo_url: str | None = None,
        staging_url: str | None = None,
        notas: str | None = None,
    ) -> Projeto:
        cliente = self.create_or_get_cliente(cliente_nome)
        payload = _clean_payload(
            {
                "cliente_id": cliente.id,
                "titulo": titulo.strip(),
                "descricao": descricao,
                "tipo": tipo,
                "valor_total": float(valor_total or 0),
                "valor_pago": 0.0,
                "status": status,
                "prazo": prazo,
                "repo_url": repo_url,
                "staging_url": staging_url,
                "notas": notas,
                "atualizado_em": datetime.now(),
            }
        )
        created = self.client.table("projetos").insert(payload).execute().data or []
        projeto_id = _parse_int(created[0]["id"])
        projeto = self.get_projeto(projeto_id)
        if projeto is None:
            raise RuntimeError("Nao foi possivel carregar o projeto criado.")
        return projeto

    def update_projeto(
        self,
        projeto_id: int,
        cliente_nome: str,
        titulo: str,
        descricao: str | None = None,
        tipo: str | None = None,
        valor_total: float = 0.0,
        status: str = "pendente",
        prazo: date | None = None,
        repo_url: str | None = None,
        staging_url: str | None = None,
        notas: str | None = None,
    ) -> Projeto:
        projeto = self.get_projeto(projeto_id)
        if projeto is None:
            raise ValueError("Projeto nao encontrado.")

        cliente = self.create_or_get_cliente(cliente_nome)
        payload = _clean_payload(
            {
                "cliente_id": cliente.id,
                "titulo": titulo.strip(),
                "descricao": descricao,
                "tipo": tipo,
                "valor_total": float(valor_total or 0),
                "status": status,
                "prazo": prazo,
                "repo_url": repo_url,
                "staging_url": staging_url,
                "notas": notas,
                "atualizado_em": datetime.now(),
            }
        )
        self.client.table("projetos").update(payload).eq("id", projeto_id).execute()
        updated = self.get_projeto(projeto_id)
        if updated is None:
            raise RuntimeError("Nao foi possivel carregar o projeto atualizado.")
        return updated

    def delete_projeto(self, projeto_id: int) -> None:
        self.client.table("pagamentos").delete().eq("projeto_id", projeto_id).execute()
        self.client.table("receitas").delete().eq("projeto_id", projeto_id).execute()
        self.client.table("tempo_projeto").delete().eq("projeto_id", projeto_id).execute()
        self.client.table("projetos").delete().eq("id", projeto_id).execute()

    def registrar_pagamento(
        self,
        projeto_id: int,
        valor: float,
        data_pagamento: date,
        metodo: str | None = None,
        notas: str | None = None,
    ) -> Pagamento:
        projeto = self.get_projeto(projeto_id)
        if projeto is None:
            raise ValueError("Projeto nao encontrado.")
        if valor <= 0:
            raise ValueError("O valor do pagamento deve ser maior do que zero.")

        payment_payload = _clean_payload(
            {
                "projeto_id": projeto_id,
                "valor": float(valor),
                "data": data_pagamento,
                "metodo": metodo,
                "notas": notas,
            }
        )
        created = self.client.table("pagamentos").insert(payment_payload).execute().data or []

        receipt_payload = _clean_payload(
            {
                "projeto_id": projeto_id,
                "descricao": f"Pagamento - {projeto.titulo}",
                "valor": float(valor),
                "data": data_pagamento,
                "origem": metodo or "Projeto",
            }
        )
        self.client.table("receitas").insert(receipt_payload).execute()

        novo_valor_pago = float(projeto.valor_pago or 0) + float(valor)
        if projeto.valor_total > 0 and novo_valor_pago >= projeto.valor_total:
            novo_status = "pago"
        elif novo_valor_pago > 0:
            novo_status = "pago_parcial"
        else:
            novo_status = projeto.status
        self.client.table("projetos").update(
            {
                "valor_pago": novo_valor_pago,
                "status": novo_status,
                "atualizado_em": datetime.now().isoformat(),
            }
        ).eq("id", projeto_id).execute()

        updated_project = self.get_projeto(projeto_id)
        return self._map_pagamento(created[0], updated_project)  # type: ignore[return-value]

    def create_gasto(
        self,
        descricao: str,
        valor: float,
        data_gasto: date,
        categoria: str | None = None,
        recorrente: bool = False,
        dia_vencimento: int | None = None,
        metodo: str | None = None,
        pago: bool = True,
        notas: str | None = None,
    ) -> Gasto:
        payload = _clean_payload(
            {
                "descricao": descricao.strip(),
                "valor": float(valor),
                "data": data_gasto,
                "categoria": categoria,
                "recorrente": 1 if recorrente else 0,
                "dia_vencimento": dia_vencimento,
                "metodo": metodo,
                "pago": 1 if pago else 0,
                "notas": notas,
            }
        )
        created = self.client.table("gastos").insert(payload).execute().data or []
        return self._map_gasto(created[0])  # type: ignore[return-value]

    def delete_gasto(self, gasto_id: int) -> None:
        self.client.table("gastos").delete().eq("id", gasto_id).execute()

    def create_receita(
        self,
        descricao: str,
        valor: float,
        data_receita: date,
        origem: str | None = None,
        projeto_id: int | None = None,
    ) -> Receita:
        payload = _clean_payload(
            {
                "projeto_id": projeto_id,
                "descricao": descricao.strip(),
                "valor": float(valor),
                "data": data_receita,
                "origem": origem,
            }
        )
        created = self.client.table("receitas").insert(payload).execute().data or []
        projeto = self.get_projeto(projeto_id) if projeto_id is not None else None
        return self._map_receita(created[0], projeto)  # type: ignore[return-value]

    def delete_receita(self, receita_id: int) -> None:
        self.client.table("receitas").delete().eq("id", receita_id).execute()

    def create_investimento(
        self,
        nome: str,
        tipo: str,
        meta_valor: float | None = None,
        meta_data: date | None = None,
        notas: str | None = None,
        ativo: bool = True,
    ) -> Investimento:
        payload = _clean_payload(
            {
                "nome": nome.strip(),
                "tipo": tipo.strip(),
                "meta_valor": meta_valor,
                "meta_data": meta_data,
                "notas": notas,
                "ativo": 1 if ativo else 0,
            }
        )
        created = self.client.table("investimentos").insert(payload).execute().data or []
        return self._map_investimento(created[0])  # type: ignore[return-value]

    def registrar_aporte(
        self,
        valor: float,
        data_aporte: date,
        tipo: str = "aporte",
        notas: str | None = None,
        investimento_id: int | None = None,
        investimento_nome: str | None = None,
        investimento_tipo: str | None = None,
        meta_valor: float | None = None,
        meta_data: date | None = None,
    ) -> Aporte:
        investment = None
        if investimento_id is not None:
            investment = self.get_investimento(investimento_id)
        if investment is None:
            if not investimento_nome or not investimento_tipo:
                raise ValueError("Informe um investimento existente ou os dados do novo investimento.")
            investment = self.create_investimento(
                nome=investimento_nome,
                tipo=investimento_tipo,
                meta_valor=meta_valor,
                meta_data=meta_data,
            )

        payload = _clean_payload(
            {
                "investimento_id": investment.id,
                "valor": float(valor),
                "data": data_aporte,
                "tipo": (tipo or "aporte").strip().lower(),
                "notas": notas,
            }
        )
        created = self.client.table("aportes").insert(payload).execute().data or []
        return self._map_aporte(created[0], investment)  # type: ignore[return-value]

    def delete_aporte(self, aporte_id: int) -> None:
        self.client.table("aportes").delete().eq("id", aporte_id).execute()

    def delete_investimento(self, investimento_id: int) -> None:
        self.client.table("aportes").delete().eq("investimento_id", investimento_id).execute()
        self.client.table("investimentos").delete().eq("id", investimento_id).execute()

    def iniciar_sessao(self, projeto_id: int, descricao: str | None = None) -> TempoProjeto:
        active = self.get_sessao_ativa()
        if active is not None:
            raise RuntimeError("Ja existe uma sessao ativa. Pare a sessao atual antes de iniciar outra.")

        projeto = self.get_projeto(projeto_id)
        if projeto is None:
            raise ValueError("Projeto nao encontrado.")

        payload = _clean_payload(
            {
                "projeto_id": projeto_id,
                "inicio": datetime.now(),
                "descricao": descricao,
            }
        )
        created = self.client.table("tempo_projeto").insert(payload).execute().data or []
        return self._map_tempo_projeto(created[0], projeto)  # type: ignore[return-value]

    def parar_sessao_ativa(self, descricao: str | None = None) -> TempoProjeto:
        active = self.get_sessao_ativa()
        if active is None:
            raise RuntimeError("Nao existe sessao ativa.")

        fim = datetime.now()
        duracao_min = max(int((fim - active.inicio).total_seconds() // 60), 0)
        payload = _clean_payload(
            {
                "fim": fim,
                "duracao_min": duracao_min,
                "descricao": descricao if descricao is not None else active.descricao,
            }
        )
        self.client.table("tempo_projeto").update(payload).eq("id", active.id).execute()

        refreshed = self.load_snapshot().tempo_projeto
        for item in refreshed:
            if item.id == active.id:
                return item
        raise RuntimeError("Nao foi possivel carregar a sessao finalizada.")

    def criar_sessao_manual(
        self,
        projeto_id: int,
        inicio: datetime,
        fim: datetime,
        descricao: str | None = None,
    ) -> TempoProjeto:
        if fim <= inicio:
            raise ValueError("A data final deve ser maior do que a inicial.")

        projeto = self.get_projeto(projeto_id)
        if projeto is None:
            raise ValueError("Projeto nao encontrado.")

        duracao_min = max(int((fim - inicio).total_seconds() // 60), 0)
        payload = _clean_payload(
            {
                "projeto_id": projeto_id,
                "inicio": inicio,
                "fim": fim,
                "duracao_min": duracao_min,
                "descricao": descricao,
            }
        )
        created = self.client.table("tempo_projeto").insert(payload).execute().data or []
        return self._map_tempo_projeto(created[0], projeto)  # type: ignore[return-value]

    def delete_tempo_sessao(self, sessao_id: int) -> None:
        self.client.table("tempo_projeto").delete().eq("id", sessao_id).execute()

    def load_snapshot(self) -> AppSnapshot:
        clientes = self._fetch_clientes()
        clientes_by_id = {item.id: item for item in clientes}
        projetos = self._fetch_projetos(clientes_by_id)
        projetos_by_id = {item.id: item for item in projetos}
        pagamentos = self._fetch_pagamentos(projetos_by_id)
        gastos = self._fetch_gastos()
        receitas = self._fetch_receitas(projetos_by_id)
        investimentos = self._fetch_investimentos()
        investimentos_by_id = {item.id: item for item in investimentos}
        aportes = self._fetch_aportes(investimentos_by_id)
        tempo_projeto = self._fetch_tempo_projeto(projetos_by_id)
        chat_mensagens = self.load_chat_mensagens()
        return AppSnapshot(
            clientes=clientes,
            projetos=projetos,
            pagamentos=pagamentos,
            gastos=gastos,
            receitas=receitas,
            investimentos=investimentos,
            aportes=aportes,
            tempo_projeto=tempo_projeto,
            chat_mensagens=chat_mensagens,
        )

    def _fetch_clientes(self) -> list[Cliente]:
        response = self.client.table("clientes").select("*").order("criado_em").execute()
        rows = response.data or []
        return [self._map_cliente(row) for row in rows]

    def _fetch_projetos(self, clientes_by_id: dict[int, Cliente]) -> list[Projeto]:
        response = (
            self.client.table("projetos")
            .select("*, clientes(*)")
            .order("criado_em", desc=True)
            .execute()
        )
        projetos: list[Projeto] = []
        for row in response.data or []:
            nested_client = _relation_payload(row.get("clientes"))
            cliente = self._map_cliente(nested_client) if nested_client else None
            cliente_id = _parse_int(row.get("cliente_id"), default=0) or None
            if cliente is None and cliente_id is not None:
                cliente = clientes_by_id.get(cliente_id)
            projeto = self._map_projeto(row, cliente)
            projetos.append(projeto)
        return projetos

    def _fetch_pagamentos(self, projetos_by_id: dict[int, Projeto]) -> list[Pagamento]:
        response = (
            self.client.table("pagamentos")
            .select("*, projetos(*)")
            .order("data", desc=True)
            .execute()
        )
        pagamentos: list[Pagamento] = []
        for row in response.data or []:
            nested_project = _relation_payload(row.get("projetos"))
            projeto = self._map_projeto(nested_project, None) if nested_project else None
            projeto_id = _parse_int(row.get("projeto_id"), default=0) or None
            if projeto is None and projeto_id is not None:
                projeto = projetos_by_id.get(projeto_id)
            pagamentos.append(self._map_pagamento(row, projeto))
        return pagamentos

    def _fetch_gastos(self) -> list[Gasto]:
        response = self.client.table("gastos").select("*").order("data", desc=True).execute()
        return [self._map_gasto(row) for row in response.data or []]

    def _fetch_receitas(self, projetos_by_id: dict[int, Projeto]) -> list[Receita]:
        response = (
            self.client.table("receitas")
            .select("*, projetos(*)")
            .order("data", desc=True)
            .execute()
        )
        receitas: list[Receita] = []
        for row in response.data or []:
            nested_project = _relation_payload(row.get("projetos"))
            projeto = self._map_projeto(nested_project, None) if nested_project else None
            projeto_id = _parse_int(row.get("projeto_id"), default=0) or None
            if projeto is None and projeto_id is not None:
                projeto = projetos_by_id.get(projeto_id)
            receitas.append(self._map_receita(row, projeto))
        return receitas

    def _fetch_investimentos(self) -> list[Investimento]:
        response = (
            self.client.table("investimentos")
            .select("*")
            .order("criado_em", desc=True)
            .execute()
        )
        return [self._map_investimento(row) for row in response.data or []]

    def _fetch_aportes(self, investimentos_by_id: dict[int, Investimento]) -> list[Aporte]:
        response = (
            self.client.table("aportes")
            .select("*, investimentos(*)")
            .order("data", desc=True)
            .execute()
        )
        aportes: list[Aporte] = []
        for row in response.data or []:
            nested_investment = _relation_payload(row.get("investimentos"))
            investimento = (
                self._map_investimento(nested_investment) if nested_investment else None
            )
            investimento_id = _parse_int(row.get("investimento_id"), default=0) or None
            if investimento is None and investimento_id is not None:
                investimento = investimentos_by_id.get(investimento_id)
            aportes.append(self._map_aporte(row, investimento))
        return aportes

    def _fetch_tempo_projeto(self, projetos_by_id: dict[int, Projeto]) -> list[TempoProjeto]:
        response = (
            self.client.table("tempo_projeto")
            .select("*, projetos(*)")
            .order("inicio", desc=True)
            .execute()
        )
        sessoes: list[TempoProjeto] = []
        for row in response.data or []:
            nested_project = _relation_payload(row.get("projetos"))
            projeto = self._map_projeto(nested_project, None) if nested_project else None
            projeto_id = _parse_int(row.get("projeto_id"), default=0) or None
            if projeto is None and projeto_id is not None:
                projeto = projetos_by_id.get(projeto_id)
            sessoes.append(self._map_tempo_projeto(row, projeto))
        return sessoes

    def _map_cliente(self, row: dict[str, Any] | None) -> Cliente | None:
        if not row:
            return None
        return Cliente(
            id=_parse_int(row.get("id")),
            nome=str(row.get("nome") or ""),
            email=row.get("email"),
            telefone=row.get("telefone"),
            empresa=row.get("empresa"),
            tipo=row.get("tipo"),
            notas=row.get("notas"),
            criado_em=_parse_datetime(row.get("criado_em")),
        )

    def _map_projeto(self, row: dict[str, Any] | None, cliente: Cliente | None) -> Projeto | None:
        if not row:
            return None
        return Projeto(
            id=_parse_int(row.get("id")),
            cliente_id=_parse_int(row.get("cliente_id"), default=0) or None,
            titulo=str(row.get("titulo") or ""),
            descricao=row.get("descricao"),
            tipo=row.get("tipo"),
            valor_total=_parse_float(row.get("valor_total")),
            valor_pago=_parse_float(row.get("valor_pago")),
            status=str(row.get("status") or "pendente"),
            prazo=_parse_date(row.get("prazo")),
            repo_url=row.get("repo_url"),
            staging_url=row.get("staging_url"),
            notas=row.get("notas"),
            criado_em=_parse_datetime(row.get("criado_em")),
            atualizado_em=_parse_datetime(row.get("atualizado_em")),
            cliente=cliente,
        )

    def _map_pagamento(
        self, row: dict[str, Any] | None, projeto: Projeto | None
    ) -> Pagamento | None:
        if not row:
            return None
        data_pagamento = _parse_date(row.get("data")) or date.today()
        return Pagamento(
            id=_parse_int(row.get("id")),
            projeto_id=_parse_int(row.get("projeto_id"), default=0) or None,
            valor=_parse_float(row.get("valor")),
            data=data_pagamento,
            metodo=row.get("metodo"),
            notas=row.get("notas"),
            criado_em=_parse_datetime(row.get("criado_em")),
            projeto=projeto,
        )

    def _map_gasto(self, row: dict[str, Any] | None) -> Gasto | None:
        if not row:
            return None
        data_gasto = _parse_date(row.get("data")) or date.today()
        category_name = row.get("categoria")
        return Gasto(
            id=_parse_int(row.get("id")),
            descricao=str(row.get("descricao") or ""),
            valor=_parse_float(row.get("valor")),
            data=data_gasto,
            categoria_nome=category_name,
            recorrente=_parse_int(row.get("recorrente"), default=0),
            dia_vencimento=_parse_int(row.get("dia_vencimento"), default=0) or None,
            metodo=row.get("metodo"),
            pago=_parse_int(row.get("pago"), default=1),
            notas=row.get("notas"),
            criado_em=_parse_datetime(row.get("criado_em")),
            categoria=category_for_name(category_name),
        )

    def _map_receita(self, row: dict[str, Any] | None, projeto: Projeto | None) -> Receita | None:
        if not row:
            return None
        data_receita = _parse_date(row.get("data")) or date.today()
        return Receita(
            id=_parse_int(row.get("id")),
            projeto_id=_parse_int(row.get("projeto_id"), default=0) or None,
            descricao=str(row.get("descricao") or ""),
            valor=_parse_float(row.get("valor")),
            data=data_receita,
            origem=row.get("origem"),
            criado_em=_parse_datetime(row.get("criado_em")),
            projeto=projeto,
        )

    def _map_investimento(self, row: dict[str, Any] | None) -> Investimento | None:
        if not row:
            return None
        return Investimento(
            id=_parse_int(row.get("id")),
            nome=str(row.get("nome") or ""),
            tipo=str(row.get("tipo") or ""),
            meta_valor=(
                _parse_float(row.get("meta_valor")) if row.get("meta_valor") is not None else None
            ),
            meta_data=_parse_date(row.get("meta_data")),
            notas=row.get("notas"),
            ativo=_parse_int(row.get("ativo"), default=1),
            criado_em=_parse_datetime(row.get("criado_em")),
        )

    def _map_aporte(
        self, row: dict[str, Any] | None, investimento: Investimento | None
    ) -> Aporte | None:
        if not row:
            return None
        data_aporte = _parse_date(row.get("data")) or date.today()
        return Aporte(
            id=_parse_int(row.get("id")),
            investimento_id=_parse_int(row.get("investimento_id"), default=0) or None,
            valor=_parse_float(row.get("valor")),
            data=data_aporte,
            tipo=row.get("tipo"),
            notas=row.get("notas"),
            criado_em=_parse_datetime(row.get("criado_em")),
            investimento=investimento,
        )

    def _map_tempo_projeto(
        self, row: dict[str, Any] | None, projeto: Projeto | None
    ) -> TempoProjeto | None:
        if not row:
            return None
        inicio = _parse_datetime(row.get("inicio")) or datetime.now()
        return TempoProjeto(
            id=_parse_int(row.get("id")),
            projeto_id=_parse_int(row.get("projeto_id"), default=0) or None,
            inicio=inicio,
            fim=_parse_datetime(row.get("fim")),
            duracao_min=_parse_int(row.get("duracao_min"), default=0) or None,
            descricao=row.get("descricao"),
            criado_em=_parse_datetime(row.get("criado_em")),
            projeto=projeto,
        )


def configuracoes_para_registros(configuracoes: dict[str, str]) -> list[Configuracao]:
    return [Configuracao(chave=chave, valor=valor) for chave, valor in configuracoes.items()]
