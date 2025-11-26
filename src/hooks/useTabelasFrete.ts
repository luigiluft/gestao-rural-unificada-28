import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface TabelaFrete {
  id: string
  franqueado_id: string
  nome: string
  tipo: string
  ativo: boolean
  transportadora_id?: string | null
  created_at: string
  updated_at: string
  frete_faixas?: FreteFaixa[]
  transportadoras?: {
    id: string
    nome: string
  }
}

export interface FreteFaixa {
  id: string
  tabela_frete_id: string
  distancia_min: number
  distancia_max: number
  valor_ate_300kg: number
  valor_por_kg_301_999: number
  pedagio_por_ton: number
  prazo_dias: number
}

export const useTabelasFrete = () => {
  const { toast } = useToast()

  return useQuery({
    queryKey: ["tabelas-frete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabelas_frete")
        .select(`
          *,
          frete_faixas (*),
          transportadoras (
            id,
            nome
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as TabelaFrete[]
    },
  })
}

export const useCreateTabelaFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      franqueado_id: string
      nome: string
      tipo?: string
      transportadora_id?: string | null
      faixas: Omit<FreteFaixa, 'id' | 'tabela_frete_id'>[]
    }) => {
      // Create table
      const { data: tabela, error: tabelaError } = await supabase
        .from("tabelas_frete")
        .insert({
          user_id: data.franqueado_id,
          franqueado_id: data.franqueado_id,
          nome: data.nome,
          tipo: data.tipo || null,
          transportadora_id: data.transportadora_id || null,
          origem: '',
          data_vigencia: new Date().toISOString().split('T')[0],
          valor_base: 0
        })
        .select()
        .single()

      if (tabelaError) throw tabelaError

      // Create ranges
      const faixasData = data.faixas.map(faixa => ({
        ...faixa,
        tabela_frete_id: tabela.id
      }))

      const { error: faixasError } = await supabase
        .from("frete_faixas")
        .insert(faixasData)

      if (faixasError) throw faixasError

      return tabela
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] })
      toast({
        title: "Tabela criada com sucesso",
        description: "A tabela de frete foi cadastrada."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tabela",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

export const useDeleteTabelaFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tabelas_frete")
        .delete()
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] })
      toast({
        title: "Tabela excluída",
        description: "A tabela de frete foi removida."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tabela",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

export const useUpdateTabelaFrete = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      id: string
      nome: string
      tipo?: string
      transportadora_id?: string | null
      ativo: boolean
      faixas: Omit<FreteFaixa, 'id' | 'tabela_frete_id'>[]
    }) => {
      // Update table
      const { error: tabelaError } = await supabase
        .from("tabelas_frete")
        .update({
          nome: data.nome,
          tipo: data.tipo,
          transportadora_id: data.transportadora_id,
          ativo: data.ativo,
        })
        .eq("id", data.id)

      if (tabelaError) throw tabelaError

      // Delete existing ranges
      const { error: deleteError } = await supabase
        .from("frete_faixas")
        .delete()
        .eq("tabela_frete_id", data.id)

      if (deleteError) throw deleteError

      // Create new ranges
      const faixasData = data.faixas.map(faixa => ({
        ...faixa,
        tabela_frete_id: data.id
      }))

      const { error: faixasError } = await supabase
        .from("frete_faixas")
        .insert(faixasData)

      if (faixasError) throw faixasError

      return data.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] })
      toast({
        title: "Tabela atualizada com sucesso",
        description: "As alterações foram salvas."
      })
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tabela",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}