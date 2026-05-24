import { z } from 'zod'

export const ProjetoSchema = z.object({
  titulo: z.string().min(1).max(100).trim(),
  valor_total: z.number().positive().max(10_000_000),
  status: z.enum(['ativo', 'pausado', 'concluido', 'cancelado']),
  prazo: z.string().datetime().optional(),
  descricao: z.string().max(1000).trim().optional(),
})

export const GastoSchema = z.object({
  categoria: z.string().min(1).max(50).trim(),
  descricao: z.string().min(1).max(500).trim(),
  valor: z.number().positive().max(1_000_000),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metodo: z.string().max(50).optional(),
})

export const ReceitaSchema = z.object({
  descricao: z.string().min(1).max(500).trim(),
  valor: z.number().positive().max(10_000_000),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  origem: z.string().max(100).trim().optional(),
})

export const InvestimentoSchema = z.object({
  nome: z.string().min(1).max(100).trim(),
  tipo: z.string().min(1).max(50).trim(),
  meta_valor: z.number().positive().max(100_000_000),
  meta_data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const ClienteSchema = z.object({
  nome: z.string().min(1).max(100).trim(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().max(20).optional(),
  empresa: z.string().max(100).trim().optional(),
  tipo: z.string().max(50).optional(),
})
