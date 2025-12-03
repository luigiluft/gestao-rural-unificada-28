import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface LojaAnuncio {
  id: string
  cliente_id: string
  produto_id: string | null
  titulo: string
  descricao_anuncio: string | null
  preco_unitario: number
  preco_promocional: number | null
  unidade_venda: string
  quantidade_minima: number
  quantidade_disponivel: number | null
  usar_estoque_real: boolean
  ativo: boolean
  visivel_marketplace: boolean
  visivel_loja_propria: boolean
  imagens: string[]
  tags: string[] | null
  categoria: string | null
  created_at: string
  updated_at: string
}

export interface AnuncioFormData {
  titulo: string
  descricao_anuncio?: string
  preco_unitario: number
  preco_promocional?: number
  unidade_venda?: string
  quantidade_minima?: number
  quantidade_disponivel?: number
  usar_estoque_real?: boolean
  visivel_marketplace?: boolean
  visivel_loja_propria?: boolean
  imagens?: string[]
  tags?: string[]
  categoria?: string
  produto_id?: string
}

export const useLojaAnuncios = () => {
  const { selectedCliente } = useCliente()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["loja-anuncios", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return []

      const { data, error } = await supabase
        .from("loja_anuncios")
        .select("*")
        .eq("cliente_id", selectedCliente.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as LojaAnuncio[]
    },
    enabled: !!selectedCliente?.id,
  })

  const createMutation = useMutation({
    mutationFn: async (anuncio: AnuncioFormData) => {
      if (!selectedCliente?.id) throw new Error("Cliente não selecionado")

      const { data, error } = await supabase
        .from("loja_anuncios")
        .insert({
          ...anuncio,
          cliente_id: selectedCliente.id,
          imagens: anuncio.imagens || [],
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-anuncios"] })
      toast.success("Anúncio criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar anúncio:", error)
      toast.error("Erro ao criar anúncio")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...anuncio }: Partial<LojaAnuncio> & { id: string }) => {
      const { data, error } = await supabase
        .from("loja_anuncios")
        .update({
          ...anuncio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-anuncios"] })
      toast.success("Anúncio atualizado!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar anúncio:", error)
      toast.error("Erro ao atualizar anúncio")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("loja_anuncios")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-anuncios"] })
      toast.success("Anúncio removido!")
    },
    onError: (error) => {
      console.error("Erro ao remover anúncio:", error)
      toast.error("Erro ao remover anúncio")
    },
  })

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("loja_anuncios")
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-anuncios"] })
    },
  })

  return {
    anuncios: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarAnuncio: createMutation.mutate,
    isCriando: createMutation.isPending,
    atualizarAnuncio: updateMutation.mutate,
    isAtualizando: updateMutation.isPending,
    removerAnuncio: deleteMutation.mutate,
    isRemovendo: deleteMutation.isPending,
    toggleAtivo: toggleAtivoMutation.mutate,
  }
}
