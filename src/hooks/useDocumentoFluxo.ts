import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface DocumentoFluxo {
  id: string
  saida_id: string | null
  entrada_id: string | null
  cte_id: string | null
  viagem_id: string | null
  cliente_origem_id: string
  cliente_destino_id: string
  operador_deposito_id: string | null
  transportadora_id: string | null
  tipo_fluxo: 'venda' | 'transferencia' | 'remessa' | 'devolucao'
  chave_nfe: string | null
  status: 'pendente' | 'recebido' | 'confirmado' | 'rejeitado'
  created_at: string
  recebido_at: string | null
  confirmado_at: string | null
  cliente_origem?: {
    id: string
    razao_social: string
    cpf_cnpj: string
  }
  cliente_destino?: {
    id: string
    razao_social: string
    cpf_cnpj: string
  }
}

export function useDocumentoFluxoBySaida(saidaId: string | null) {
  return useQuery({
    queryKey: ["documento-fluxo", "saida", saidaId],
    queryFn: async () => {
      if (!saidaId) return null
      
      const { data, error } = await supabase
        .from("documento_fluxo")
        .select(`
          *,
          cliente_origem:clientes!documento_fluxo_cliente_origem_id_fkey(id, razao_social, cpf_cnpj),
          cliente_destino:clientes!documento_fluxo_cliente_destino_id_fkey(id, razao_social, cpf_cnpj)
        `)
        .eq("saida_id", saidaId)
        .maybeSingle()
      
      if (error) throw error
      return data as DocumentoFluxo | null
    },
    enabled: !!saidaId,
  })
}

export function useDocumentoFluxoByEntrada(entradaId: string | null) {
  return useQuery({
    queryKey: ["documento-fluxo", "entrada", entradaId],
    queryFn: async () => {
      if (!entradaId) return null
      
      const { data, error } = await supabase
        .from("documento_fluxo")
        .select(`
          *,
          cliente_origem:clientes!documento_fluxo_cliente_origem_id_fkey(id, razao_social, cpf_cnpj),
          cliente_destino:clientes!documento_fluxo_cliente_destino_id_fkey(id, razao_social, cpf_cnpj)
        `)
        .eq("entrada_id", entradaId)
        .maybeSingle()
      
      if (error) throw error
      return data as DocumentoFluxo | null
    },
    enabled: !!entradaId,
  })
}

export function useDocumentosFluxoPendentes(clienteDestinoId: string | null) {
  return useQuery({
    queryKey: ["documentos-fluxo", "pendentes", clienteDestinoId],
    queryFn: async () => {
      if (!clienteDestinoId) return []
      
      const { data, error } = await supabase
        .from("documento_fluxo")
        .select(`
          *,
          cliente_origem:clientes!documento_fluxo_cliente_origem_id_fkey(id, razao_social, cpf_cnpj),
          saida:saidas(id, numero_nfe, valor_total, data_saida)
        `)
        .eq("cliente_destino_id", clienteDestinoId)
        .eq("status", "pendente")
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!clienteDestinoId,
  })
}

export function useAtualizarStatusFluxo() {
  const atualizarStatus = async (fluxoId: string, status: 'recebido' | 'confirmado' | 'rejeitado') => {
    const updateData: Record<string, string> = { status }
    
    if (status === 'recebido') {
      updateData.recebido_at = new Date().toISOString()
    } else if (status === 'confirmado') {
      updateData.confirmado_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from("documento_fluxo")
      .update(updateData)
      .eq("id", fluxoId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  return { atualizarStatus }
}
