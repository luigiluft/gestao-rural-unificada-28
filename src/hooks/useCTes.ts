import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useCTes = () => {
  return useQuery({
    queryKey: ["ctes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctes")
        .select("*, saidas(id, data_saida, tipo_saida)")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export const useCTeBySaida = (saidaId?: string) => {
  return useQuery({
    queryKey: ["cte-by-saida", saidaId],
    queryFn: async () => {
      if (!saidaId) return null
      
      const { data, error } = await supabase.functions.invoke('manage-ctes', {
        body: { action: 'get_by_saida', data: { saidaId } }
      })

      if (error) throw error
      return data?.data
    },
    enabled: !!saidaId,
  })
}

export const useCTeDetails = (cteId?: string) => {
  return useQuery({
    queryKey: ["cte-details", cteId],
    queryFn: async () => {
      if (!cteId) return null
      
      const { data, error } = await supabase
        .from("ctes")
        .select(`
          *,
          saidas(
            id,
            data_saida,
            tipo_saida,
            observacoes,
            franquias:deposito_id(nome, cnpj, cidade, estado),
            fazendas(nome, cpf_cnpj, cidade, estado)
          )
        `)
        .eq("id", cteId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!cteId,
  })
}

export const useCreateCTe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cteData: any) => {
      const { data, error } = await supabase.functions.invoke('manage-ctes', {
        body: { action: 'create', data: cteData }
      })

      if (error) throw error
      return data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] })
      toast.success("CT-e criado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar CT-e: ${error.message}`)
    },
  })
}

export const useUpdateCTe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: any) => {
      const { data, error } = await supabase.functions.invoke('manage-ctes', {
        body: { action: 'update', data: { id, ...updateData } }
      })

      if (error) throw error
      return data?.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] })
      queryClient.invalidateQueries({ queryKey: ["cte-details", data.id] })
      queryClient.invalidateQueries({ queryKey: ["cte-by-saida", data.saida_id] })
      toast.success("CT-e atualizado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar CT-e: ${error.message}`)
    },
  })
}

export const useDeleteCTe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cteId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-ctes', {
        body: { action: 'delete', data: { id: cteId } }
      })

      if (error) throw error
      return data?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctes"] })
      toast.success("CT-e excluído com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir CT-e: ${error.message}`)
    },
  })
}

export const useGenerateXML = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cteId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-ctes', {
        body: { action: 'generate_xml', data: { id: cteId } }
      })

      if (error) throw error
      return data?.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cte-details", data.cte.id] })
      toast.success("XML do CT-e gerado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar XML: ${error.message}`)
    },
  })
}