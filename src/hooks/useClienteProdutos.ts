import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface ClienteProduto {
  id: string
  cliente_id: string
  codigo_produto: string | null
  nome_produto: string
  descricao: string | null
  unidade_medida: string
  ncm: string | null
  preco_unitario: number | null
  preco_promocional: number | null
  categoria: string | null
  descricao_anuncio: string | null
  imagens: string[]
  ativo_marketplace: boolean
  ativo_loja_propria: boolean
  quantidade_minima: number
  quantidade_embalagem: number
  usar_estoque_real: boolean
  created_at: string
  updated_at: string
}

export interface ClienteProdutoFormData {
  preco_unitario?: number | null
  preco_promocional?: number | null
  categoria?: string | null
  descricao_anuncio?: string | null
  imagens?: string[]
  ativo_marketplace?: boolean
  ativo_loja_propria?: boolean
  quantidade_minima?: number
  usar_estoque_real?: boolean
}

export const useClienteProdutos = () => {
  const { selectedCliente } = useCliente()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["cliente-produtos", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return []

      const { data, error } = await supabase
        .from("cliente_produtos")
        .select("*")
        .eq("cliente_id", selectedCliente.id)
        .order("nome_produto", { ascending: true })

      if (error) throw error
      return data as ClienteProduto[]
    },
    enabled: !!selectedCliente?.id,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteProdutoFormData }) => {
      const { data: result, error } = await supabase
        .from("cliente_produtos")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-produtos"] })
      toast.success("Produto atualizado!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar produto:", error)
      toast.error("Erro ao atualizar produto")
    },
  })

  const toggleMarketplaceMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cliente_produtos")
        .update({ ativo_marketplace: ativo, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-produtos"] })
      toast.success(ativo ? "Produto ativado no marketplace!" : "Produto desativado do marketplace")
    },
    onError: (error) => {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status do produto")
    },
  })

  const toggleLojaMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cliente_produtos")
        .update({ ativo_loja_propria: ativo, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-produtos"] })
      toast.success(ativo ? "Produto ativado na loja!" : "Produto desativado da loja")
    },
    onError: (error) => {
      console.error("Erro ao alterar status:", error)
      toast.error("Erro ao alterar status do produto")
    },
  })

  return {
    produtos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    updateProduto: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    toggleMarketplace: toggleMarketplaceMutation.mutate,
    toggleLoja: toggleLojaMutation.mutate,
  }
}
