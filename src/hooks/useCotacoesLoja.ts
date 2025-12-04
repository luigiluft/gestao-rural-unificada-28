import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface CotacaoLoja {
  id: string
  cliente_id: string
  consumidor_id: string | null
  consumidor_nome: string
  consumidor_email: string
  consumidor_telefone: string | null
  consumidor_empresa: string | null
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'convertida' | 'contra_proposta'
  observacoes: string | null
  resposta_cliente: string | null
  data_resposta: string | null
  precos_negociados: Record<string, number> | null
  versao: number
  historico_negociacao: NegociacaoHistorico[]
  ultima_acao_por: string | null
  created_at: string
  updated_at: string
}

export interface NegociacaoHistorico {
  versao: number
  data: string
  acao: 'criada' | 'aprovada' | 'rejeitada' | 'contra_proposta' | 'aceita' | 'convertida'
  por: 'consumidor' | 'vendedor'
  mensagem?: string
  precos?: Record<string, number>
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
      
      return (data || []).map(item => ({
        ...item,
        historico_negociacao: Array.isArray(item.historico_negociacao) 
          ? item.historico_negociacao as unknown as NegociacaoHistorico[]
          : []
      })) as unknown as CotacaoComItens[]
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
      // Fetch current cotacao to update historico
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: status as NegociacaoHistorico['acao'],
        por: 'vendedor',
        mensagem: resposta
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status, 
          resposta_cliente: resposta,
          data_resposta: new Date().toISOString(),
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'vendedor',
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

  // Enviar contra-proposta (vendedor)
  const enviarContraPropostaMutation = useMutation({
    mutationFn: async ({ 
      id, 
      precos,
      mensagem 
    }: { 
      id: string
      precos: Record<string, number>
      mensagem?: string 
    }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'contra_proposta',
        por: 'vendedor',
        mensagem,
        precos
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'contra_proposta',
          precos_negociados: precos,
          resposta_cliente: mensagem,
          data_resposta: new Date().toISOString(),
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'vendedor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-loja"] })
      toast.success("Contra-proposta enviada!")
    },
    onError: (error) => {
      console.error("Erro ao enviar contra-proposta:", error)
      toast.error("Erro ao enviar contra-proposta")
    },
  })

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    enviarContraProposta: enviarContraPropostaMutation.mutate,
    isEnviandoProposta: enviarContraPropostaMutation.isPending,
  }
}

// Hook para consumidor gerenciar suas cotações
export const useCotacoesConsumidor = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["cotacoes-consumidor", user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("cotacoes_loja")
        .select(`
          *,
          itens:cotacao_itens(
            *,
            produto:cliente_produtos(nome_produto, unidade_medida, preco_unitario)
          )
        `)
        .eq("consumidor_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      return (data || []).map(item => ({
        ...item,
        historico_negociacao: Array.isArray(item.historico_negociacao) 
          ? item.historico_negociacao as unknown as NegociacaoHistorico[]
          : []
      })) as unknown as CotacaoComItens[]
    },
    enabled: !!user?.id,
  })

  // Consumidor aceita a proposta
  const aceitarPropostaMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'aceita',
        por: 'consumidor'
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'aprovada',
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'consumidor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-consumidor"] })
      toast.success("Proposta aceita!")
    },
    onError: (error) => {
      console.error("Erro ao aceitar proposta:", error)
      toast.error("Erro ao aceitar proposta")
    },
  })

  // Consumidor rejeita a proposta
  const rejeitarPropostaMutation = useMutation({
    mutationFn: async ({ id, mensagem }: { id: string; mensagem?: string }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'rejeitada',
        por: 'consumidor',
        mensagem
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'rejeitada',
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'consumidor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-consumidor"] })
      toast.success("Proposta rejeitada")
    },
    onError: (error) => {
      console.error("Erro ao rejeitar proposta:", error)
      toast.error("Erro ao rejeitar proposta")
    },
  })

  // Consumidor envia contra-proposta
  const enviarContraPropostaConsumidorMutation = useMutation({
    mutationFn: async ({ 
      id, 
      precos,
      mensagem 
    }: { 
      id: string
      precos: Record<string, number>
      mensagem?: string 
    }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'contra_proposta',
        por: 'consumidor',
        mensagem,
        precos
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'pendente',
          precos_negociados: precos,
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'consumidor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-consumidor"] })
      toast.success("Contra-proposta enviada!")
    },
    onError: (error) => {
      console.error("Erro ao enviar contra-proposta:", error)
      toast.error("Erro ao enviar contra-proposta")
    },
  })

  // Consumidor edita quantidades e envia para reanálise
  const editarQuantidadesMutation = useMutation({
    mutationFn: async ({ 
      id, 
      itens,
      mensagem 
    }: { 
      id: string
      itens: Array<{ item_id: string; quantidades: number[] }>
      mensagem?: string 
    }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'contra_proposta',
        por: 'consumidor',
        mensagem: mensagem || 'Quantidades editadas pelo consumidor'
      }

      // Atualizar cotação
      const { error: cotacaoError } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'pendente',
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'consumidor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (cotacaoError) throw cotacaoError

      // Atualizar itens
      for (const item of itens) {
        const { error: itemError } = await supabase
          .from("cotacao_itens")
          .update({
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
          })
          .eq("id", item.item_id)

        if (itemError) throw itemError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-consumidor"] })
      toast.success("Cotação enviada para reanálise!")
    },
    onError: (error) => {
      console.error("Erro ao editar quantidades:", error)
      toast.error("Erro ao editar quantidades")
    },
  })

  // Converter cotação aprovada em pedido
  const converterEmPedidoMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: current } = await supabase
        .from("cotacoes_loja")
        .select("versao, historico_negociacao")
        .eq("id", id)
        .single()

      const historico = Array.isArray(current?.historico_negociacao) 
        ? current.historico_negociacao 
        : []
      
      const novaVersao = (current?.versao || 1) + 1
      const novoHistorico: NegociacaoHistorico = {
        versao: novaVersao,
        data: new Date().toISOString(),
        acao: 'convertida',
        por: 'consumidor'
      }

      const { error } = await supabase
        .from("cotacoes_loja")
        .update({ 
          status: 'convertida',
          versao: novaVersao,
          historico_negociacao: [...historico, novoHistorico] as unknown as null,
          ultima_acao_por: 'consumidor',
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) throw error
      
      // TODO: Criar pedido em loja_pedidos com base na cotação
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-consumidor"] })
      toast.success("Cotação convertida em pedido!")
    },
    onError: (error) => {
      console.error("Erro ao converter em pedido:", error)
      toast.error("Erro ao converter em pedido")
    },
  })

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    aceitarProposta: aceitarPropostaMutation.mutate,
    isAceitando: aceitarPropostaMutation.isPending,
    rejeitarProposta: rejeitarPropostaMutation.mutate,
    isRejeitando: rejeitarPropostaMutation.isPending,
    enviarContraProposta: enviarContraPropostaConsumidorMutation.mutate,
    isEnviandoProposta: enviarContraPropostaConsumidorMutation.isPending,
    editarQuantidades: editarQuantidadesMutation.mutate,
    isEditandoQuantidades: editarQuantidadesMutation.isPending,
    converterEmPedido: converterEmPedidoMutation.mutate,
    isConvertendo: converterEmPedidoMutation.isPending,
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
      const historicoInicial: NegociacaoHistorico = {
        versao: 1,
        data: new Date().toISOString(),
        acao: 'criada',
        por: 'consumidor'
      }

      // Create cotacao
      const { data: cotacao, error: cotacaoError } = await supabase
        .from("cotacoes_loja")
        .insert([{
          cliente_id: clienteId,
          consumidor_id: consumidor.userId || null,
          consumidor_nome: consumidor.nome,
          consumidor_email: consumidor.email,
          consumidor_telefone: consumidor.telefone || null,
          consumidor_empresa: consumidor.empresa || null,
          observacoes: observacoes || null,
          versao: 1,
          historico_negociacao: [historicoInicial] as unknown as null,
          ultima_acao_por: 'consumidor'
        }])
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
