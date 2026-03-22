export type Maybe<T> = T | null
export type Relation<T> = Maybe<T | T[]>

export interface ClienteSummary {
  empresa?: Maybe<string>
  email?: Maybe<string>
  id: number
  nome: string
}

export interface ProjetoSummary {
  id: number
  titulo: string
}

export interface InvestimentoSummary {
  id: number
  nome: string
  tipo: string
}

export interface Cliente {
  id: number
  nome: string
  email?: Maybe<string>
  telefone?: Maybe<string>
  empresa?: Maybe<string>
}

export interface Projeto {
  id: number
  cliente_id: Maybe<number>
  titulo: string
  descricao: Maybe<string>
  tipo: Maybe<string>
  valor_total: Maybe<number>
  valor_pago: Maybe<number>
  status: Maybe<string>
  prazo: Maybe<string>
  repo_url: Maybe<string>
  staging_url: Maybe<string>
  notas: Maybe<string>
  criado_em: Maybe<string>
  atualizado_em: Maybe<string>
  clientes?: Relation<ClienteSummary>
}

export interface Gasto {
  id: number
  descricao: string
  valor: number
  data: string
  categoria_nome: Maybe<string>
  recorrente: number
  dia_vencimento: Maybe<number>
  metodo: Maybe<string>
  pago: number
  notas: Maybe<string>
  criado_em: Maybe<string>
}

export interface Receita {
  id: number
  projeto_id: Maybe<number>
  descricao: string
  valor: number
  data: string
  origem: Maybe<string>
  criado_em: Maybe<string>
  projetos?: Relation<ProjetoSummary>
}

export interface Investimento {
  id: number
  nome: string
  tipo: string
  meta_valor: Maybe<number>
  meta_data: Maybe<string>
  notas: Maybe<string>
  ativo: number
  criado_em: Maybe<string>
}

export interface Aporte {
  id: number
  investimento_id: Maybe<number>
  valor: number
  data: string
  tipo: Maybe<string>
  notas: Maybe<string>
  criado_em: Maybe<string>
  investimentos?: Relation<InvestimentoSummary>
}

export interface TempoProjeto {
  id: number
  projeto_id: Maybe<number>
  inicio: string
  fim: Maybe<string>
  duracao_min: Maybe<number>
  descricao: Maybe<string>
  criado_em: Maybe<string>
  projetos?: Relation<ProjetoSummary>
}

export interface Configuracao {
  chave: string
  valor: string
}

export type ConfigMap = Record<string, string>
