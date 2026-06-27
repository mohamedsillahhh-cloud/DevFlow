import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface DbCliente {
  id?: number
  nome: string
  email?: string | null
  telefone?: string | null
  empresa?: string | null
}

export interface DbProjeto {
  id?: number
  cliente_id: number | null
  titulo: string
  descricao: string | null
  tipo: string | null
  valor_total: number | null
  valor_pago: number | null
  status: string | null
  prazo: string | null
  repo_url: string | null
  staging_url: string | null
  notas: string | null
  criado_em: string | null
  atualizado_em: string | null
}

export interface DbGasto {
  id?: number
  descricao: string
  valor: number
  data: string
  categoria_nome: string | null
  recorrente: number
  dia_vencimento: number | null
  metodo: string | null
  pago: number
  notas: string | null
  criado_em: string | null
}

export interface DbReceita {
  id?: number
  projeto_id: number | null
  descricao: string
  valor: number
  data: string
  origem: string | null
  criado_em: string | null
}

export interface DbInvestimento {
  id?: number
  nome: string
  tipo: string
  meta_valor: number | null
  meta_data: string | null
  notas: string | null
  ativo: number
  criado_em: string | null
}

export interface DbAporte {
  id?: number
  investimento_id: number | null
  valor: number
  data: string
  tipo: string | null
  notas: string | null
  criado_em: string | null
}

export interface DbTempoProjeto {
  id?: number
  projeto_id: number | null
  inicio: string
  fim: string | null
  duracao_min: number | null
  descricao: string | null
  criado_em: string | null
}

export interface DbConfiguracao {
  chave: string
  valor: string
}

export interface DbPagamento {
  id?: number
  projeto_id: number | null
  valor: number
  data: string
  metodo: string | null
  criado_em: string | null
}

export class DevFlowDB extends Dexie {
  clientes!: Table<DbCliente, number>
  projetos!: Table<DbProjeto, number>
  gastos!: Table<DbGasto, number>
  receitas!: Table<DbReceita, number>
  investimentos!: Table<DbInvestimento, number>
  aportes!: Table<DbAporte, number>
  tempo_projeto!: Table<DbTempoProjeto, number>
  configuracoes!: Table<DbConfiguracao, string>
  pagamentos!: Table<DbPagamento, number>

  constructor() {
    super('DevFlowDB')
    this.version(2).stores({
      clientes: '++id, nome',
      projetos: '++id, cliente_id, status, prazo',
      gastos: '++id, data, categoria_nome, pago',
      receitas: '++id, data, projeto_id',
      investimentos: '++id, nome, tipo, criado_em',
      aportes: '++id, investimento_id, data, tipo',
      tempo_projeto: '++id, projeto_id, inicio',
      configuracoes: 'chave',
      pagamentos: '++id, projeto_id',
    })
  }
}

export const db = new DevFlowDB()
