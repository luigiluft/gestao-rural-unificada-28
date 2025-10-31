import { z } from "zod"

export const servicoContratoSchema = z.object({
  tipo_servico: z.enum(['armazenagem_pallet_dia', 'entrada_item', 'saida_item', 'taxa_fixa_mensal', 'movimentacao_interna', 'separacao_picking', 'repaletizacao']),
  descricao: z.string().optional(),
  quantidade_incluida: z.number().nonnegative("Quantidade incluída deve ser não negativa").optional(),
  quantidade_minima: z.number().nonnegative("Quantidade mínima deve ser não negativa").optional(),
  valor_unitario: z.number().positive("Valor unitário deve ser positivo"),
  valor_excedente: z.number().positive("Valor excedente deve ser positivo").optional(),
})

export const slaSchema = z.object({
  tipo_sla: z.enum(['tempo_processamento_entrada', 'tempo_preparacao_saida', 'prazo_entrega', 'taxa_avarias_max', 'tempo_resposta_divergencia']),
  descricao: z.string().optional(),
  valor_esperado: z.number().positive("Valor meta deve ser positivo"),
  unidade: z.enum(['horas', 'dias', 'percentual']),
  penalidade_percentual: z.number().min(0).max(100).optional(),
})

export const janelaEntregaSchema = z.object({
  dia_semana: z.number().min(0).max(6),
  horario_inicio: z.string().regex(/^\d{2}:\d{2}$/, "Formato: HH:MM"),
  horario_fim: z.string().regex(/^\d{2}:\d{2}$/, "Formato: HH:MM"),
  capacidade_maxima: z.number().positive("Capacidade deve ser positiva").optional(),
  observacoes: z.string().optional(),
})

export const contratoSchema = z.object({
  numero_contrato: z.string().min(1, "Número do contrato é obrigatório"),
  franquia_id: z.string().uuid("ID da franquia inválido"),
  produtor_id: z.string().uuid("ID do produtor inválido"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().optional().nullable(),
  dia_vencimento: z.number().min(1).max(31),
  tipo_cobranca: z.enum(['mensal', 'quinzenal', 'por_demanda']),
  observacoes: z.string().optional().nullable(),
  status: z.enum(['ativo', 'suspenso', 'expirado', 'cancelado']).default('ativo'),
  servicos: z.array(servicoContratoSchema).optional(),
  slas: z.array(slaSchema).optional(),
  janelas_entrega: z.array(janelaEntregaSchema).optional(),
})

export const faturaSchema = z.object({
  numero_fatura: z.string().optional(),
  contrato_id: z.string().uuid("ID do contrato inválido"),
  data_emissao: z.string().min(1, "Data de emissão é obrigatória"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  valor_servicos: z.number().nonnegative("Valor deve ser não negativo"),
  valor_royalties: z.number().nonnegative("Valor deve ser não negativo"),
  valor_descontos: z.number().nonnegative("Valor deve ser não negativo").optional(),
  valor_acrescimos: z.number().nonnegative("Valor deve ser não negativo").optional(),
  valor_total: z.number().positive("Valor total deve ser positivo"),
  observacoes: z.string().optional(),
})

export type ServicoContratoFormData = z.infer<typeof servicoContratoSchema>
export type SLAFormData = z.infer<typeof slaSchema>
export type JanelaEntregaFormData = z.infer<typeof janelaEntregaSchema>
export type ContratoFormData = z.infer<typeof contratoSchema>
export type FaturaFormData = z.infer<typeof faturaSchema>
