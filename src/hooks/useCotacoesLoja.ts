import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface CotacaoLoja {
  id: string
  cliente_id: string
  consumidor_id: string | null
  consumidor_nome: string
  consumidor_email: string
  consumidor_telefone: string | null
  consumidor_empresa: string | null
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'convertida'
  observacoes: string | null
  resposta_cliente: string | null
  data_resposta: string | null
  created_at: string
  updated_at: string
}

export interface CotacaoItem {
  id: string
  cotacao_id: string
  produto_id: string
  mes_1: number
  mes_2: number
  mes_3: number
  mes_4: number
  mes_5: number
  mes_6: number
  mes_7: number
  mes_8: number
  mes_9: number
  mes_10: number
  mes_11: number
  mes_12: number
  preco_sugerido: number | null
  observacoes: string | null
  created_at: string
  produto?: {
    nome_produto: string
    unidade_medida: string
    preco_unitario: number | null
  }
}

export interface CotacaoComItens extends CotacaoLoja {
  itens: CotacaoItem[]
}

export const useCotacoesLoja = () => {
  const { selectedCliente } = useCliente()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["cotacoes-loja", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return []

      const { data, error } = await supabase
        .from("cotacoes_loja")
        .select(`
          *,
          itens:cotacao_itens(
            *,
            produto:cliente_produtos(nome_produto, unidade_medida, preco_unitario)
          )
        `)
        .eq("cliente_id", selectedCliente.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as CotacaoComItens[]
    },
    enabled: !!selectedCliente?.id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      resposta 
    }: { 
      id: string
      status: CotacaoLoja['status']
      resposta?: string 
    }) => {
      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status, 
          resposta_cliente: resposta,
          data_resposta: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-loja"] })
      toast.success("Cotação atualizada!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar cotação:", error)
      toast.error("Erro ao atualizar cotação")
    },
  })

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  }
}

export const useEnviarCotacao = () => {
  const mutation = useMutation({
    mutationFn: async ({
      clienteId,
      consumidor,
      itens,
      observacoes
    }: {
      clienteId: string
      consumidor: {
        nome: string
        email: string
        telefone?: string
        empresa?: string
        userId?: string
      }
      itens: Array<{
        produto_id: string
        quantidades: number[]
      }>
      observacoes?: string
    }) => {
      // Create cotacao
      const { data: cotacao, error: cotacaoError } = await supabase
        .from("cotacoes_loja")
        .insert({
          cliente_id: clienteId,
          consumidor_id: consumidor.userId || null,
          consumidor_nome: consumidor.nome,
          consumidor_email: consumidor.email,
          consumidor_telefone: consumidor.telefone || null,
          consumidor_empresa: consumidor.empresa || null,
          observacoes: observacoes || null,
        })
        .select()
        .single()

      if (cotacaoError) throw cotacaoError

      // Create items
      const itensToInsert = itens
        .filter(item => item.quantidades.some(q => q > 0))
        .map(item => ({
          cotacao_id: cotacao.id,
          produto_id: item.produto_id,
          mes_1: item.quantidades[0] || 0,
          mes_2: item.quantidades[1] || 0,
          mes_3: item.quantidades[2] || 0,
          mes_4: item.quantidades[3] || 0,
          mes_5: item.quantidades[4] || 0,
          mes_6: item.quantidades[5] || 0,
          mes_7: item.quantidades[6] || 0,
          mes_8: item.quantidades[7] || 0,
          mes_9: item.quantidades[8] || 0,
          mes_10: item.quantidades[9] || 0,
          mes_11: item.quantidades[10] || 0,
          mes_12: item.quantidades[11] || 0,
        }))

      if (itensToInsert.length > 0) {
        const { error: itensError } = await supabase
          .from("cotacao_itens")
          .insert(itensToInsert)

        if (itensError) throw itensError
      }

      return cotacao
    },
    onSuccess: () => {
      toast.success("Cotação enviada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao enviar cotação:", error)
      toast.error("Erro ao enviar cotação")
    },
  })

  return {
    enviarCotacao: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
