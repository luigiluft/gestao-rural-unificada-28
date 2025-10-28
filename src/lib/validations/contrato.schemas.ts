import { z } from "zod"

export const servicoContratoSchema = z.object({
  tipo_servico: z.enum(['armazenagem_ton', 'armazenagem_pallet', 'movimentacao', 'expedicao', 'recebimento', 'outro']),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  quantidade_contratada: z.number().positive("Quantidade deve ser positiva").optional(),
  valor_unitario: z.number().positive("Valor unitário deve ser positivo"),
  percentual_repasse: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  observacoes: z.string().optional(),
})

export const slaSchema = z.object({
  tipo_sla: z.enum(['prazo_recebimento', 'prazo_expedicao', 'disponibilidade_estoque', 'acuracia_inventario', 'outro']),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor_meta: z.number().positive("Valor meta deve ser positivo"),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  penalidade_descumprimento: z.string().optional(),
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
  tipo_cobranca: z.enum(['mensal', 'quinzenal']),
  observacoes: z.string().optional().nullable(),
  status: z.enum(['ativo', 'suspenso', 'expirado', 'cancelado']).default('ativo'),
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
