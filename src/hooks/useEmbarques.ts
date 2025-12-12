import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface EmbarqueDestino {
  endereco: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    lat?: number
    lng?: number
  }
  janela_inicio?: string
  janela_fim?: string
  contato?: string
  telefone?: string
  ordem: number
}

export interface Embarque {
  id: string
  cliente_id: string
  numero: string
  tipo_origem: 'BASE_PROPRIA' | 'COLETA'
  origem_deposito_id: string | null
  origem_endereco: {
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    lat?: number
    lng?: number
    contato?: string
    telefone?: string
  } | null
  origem_janela_inicio: string | null
  origem_janela_fim: string | null
  destinos: EmbarqueDestino[]
  peso_total: number | null
  volume_total: number | null
  quantidade_volumes: number | null
  saidas_ids: string[]
  status: 'pendente' | 'aguardando_frete' | 'em_roteirizacao' | 'em_transito' | 'entregue' | 'cancelado'
  observacoes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  // Joins
  origem_deposito?: {
    id: string
    nome: string
    franquia_id: string
  } | null
}

export const useEmbarques = () => {
  const { selectedCliente } = useCliente()

  return useQuery({
    queryKey: ["embarques", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return []

      const { data, error } = await supabase
        .from("embarques")
        .select(`
          *,
          origem_deposito:cliente_depositos(id, nome, franquia_id)
        `)
        .eq("cliente_id", selectedCliente.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar embarques:", error)
        throw error
      }

      return (data || []) as unknown as Embarque[]
    },
    enabled: !!selectedCliente?.id,
  })
}

export const useCreateEmbarque = () => {
  const queryClient = useQueryClient()
  const { selectedCliente } = useCliente()

  return useMutation({
    mutationFn: async (data: Partial<Omit<Embarque, 'id' | 'numero' | 'created_at' | 'updated_at' | 'created_by'>>) => {
      if (!selectedCliente?.id) throw new Error("Nenhuma empresa selecionada")

      // Gerar número do embarque
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('gerar_numero_embarque', { p_cliente_id: selectedCliente.id })

      if (numeroError) throw numeroError

      const insertData = {
        cliente_id: selectedCliente.id,
        numero: numeroData as string,
        tipo_origem: data.tipo_origem || 'BASE_PROPRIA',
        origem_deposito_id: data.origem_deposito_id,
        origem_endereco: data.origem_endereco as unknown as Record<string, unknown> | null,
        origem_janela_inicio: data.origem_janela_inicio,
        origem_janela_fim: data.origem_janela_fim,
        destinos: (data.destinos || []) as unknown as Record<string, unknown>[],
        peso_total: data.peso_total,
        volume_total: data.volume_total,
        quantidade_volumes: data.quantidade_volumes,
        saidas_ids: (data.saidas_ids || []) as unknown as string[],
        status: data.status || 'pendente',
        observacoes: data.observacoes,
      }

      const { data: result, error } = await supabase
        .from("embarques")
        .insert(insertData as any)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embarques"] })
      toast.success("Embarque criado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar embarque: " + error.message)
    },
  })
}

export const useUpdateEmbarque = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Embarque> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...data }
      if (data.destinos) updateData.destinos = data.destinos as unknown as Record<string, unknown>[]
      if (data.saidas_ids) updateData.saidas_ids = data.saidas_ids as unknown as Record<string, unknown>[]
      if (data.origem_endereco) updateData.origem_endereco = data.origem_endereco as unknown as Record<string, unknown>
      
      const { data: result, error } = await supabase
        .from("embarques")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embarques"] })
      toast.success("Embarque atualizado!")
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar embarque: " + error.message)
    },
  })
}

export const useDeleteEmbarque = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("embarques")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["embarques"] })
      toast.success("Embarque excluído!")
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir embarque: " + error.message)
    },
  })
}
