from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass(slots=True)
class Cliente:
    id: int
    nome: str
    email: str | None = None
    telefone: str | None = None
    empresa: str | None = None
    tipo: str | None = None
    notas: str | None = None
    criado_em: datetime | None = None


@dataclass(slots=True)
class CategoriaGasto:
    nome: str
    cor: str | None = None
    icone: str | None = None


@dataclass(slots=True)
class Projeto:
    id: int
    cliente_id: int | None
    titulo: str
    descricao: str | None = None
    tipo: str | None = None
    valor_total: float = 0.0
    valor_pago: float = 0.0
    status: str = "pendente"
    prazo: date | None = None
    repo_url: str | None = None
    staging_url: str | None = None
    notas: str | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    cliente: Cliente | None = None


@dataclass(slots=True)
class Pagamento:
    id: int
    projeto_id: int | None
    valor: float
    data: date
    metodo: str | None = None
    notas: str | None = None
    criado_em: datetime | None = None
    projeto: Projeto | None = None


@dataclass(slots=True)
class Gasto:
    id: int
    descricao: str
    valor: float
    data: date
    categoria_nome: str | None = None
    recorrente: int = 0
    dia_vencimento: int | None = None
    metodo: str | None = None
    pago: int = 1
    notas: str | None = None
    criado_em: datetime | None = None
    categoria: CategoriaGasto | None = None


@dataclass(slots=True)
class Receita:
    id: int
    projeto_id: int | None
    descricao: str
    valor: float
    data: date
    origem: str | None = None
    criado_em: datetime | None = None
    projeto: Projeto | None = None


@dataclass(slots=True)
class Investimento:
    id: int
    nome: str
    tipo: str
    meta_valor: float | None = None
    meta_data: date | None = None
    notas: str | None = None
    ativo: int = 1
    criado_em: datetime | None = None


@dataclass(slots=True)
class Aporte:
    id: int
    investimento_id: int | None
    valor: float
    data: date
    tipo: str | None = None
    notas: str | None = None
    criado_em: datetime | None = None
    investimento: Investimento | None = None


@dataclass(slots=True)
class TempoProjeto:
    id: int
    projeto_id: int | None
    inicio: datetime
    fim: datetime | None = None
    duracao_min: int | None = None
    descricao: str | None = None
    criado_em: datetime | None = None
    projeto: Projeto | None = None


@dataclass(slots=True)
class Configuracao:
    chave: str
    valor: str


@dataclass(slots=True)
class ChatMensagem:
    autor: str
    texto: str
    criado_em: datetime


@dataclass(slots=True)
class AppSnapshot:
    clientes: list[Cliente] = field(default_factory=list)
    projetos: list[Projeto] = field(default_factory=list)
    pagamentos: list[Pagamento] = field(default_factory=list)
    gastos: list[Gasto] = field(default_factory=list)
    receitas: list[Receita] = field(default_factory=list)
    investimentos: list[Investimento] = field(default_factory=list)
    aportes: list[Aporte] = field(default_factory=list)
    tempo_projeto: list[TempoProjeto] = field(default_factory=list)
    chat_mensagens: list[ChatMensagem] = field(default_factory=list)
