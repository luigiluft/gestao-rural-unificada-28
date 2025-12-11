import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { useToast } from "@/hooks/use-toast"

interface ClienteModulos {
  wms_habilitado: boolean
  tms_habilitado: boolean
  ecommerce_habilitado: boolean
  atendimento_habilitado: boolean
}

export const useClienteModulos = () => {
  const { selectedCliente } = useCliente()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const clienteId = selectedCliente?.id

  const { data: modulos, isLoading, refetch } = useQuery({
    queryKey: ["cliente-modulos", clienteId],
    queryFn: async (): Promise<ClienteModulos> => {
      if (!clienteId) {
        console.log('[useClienteModulos] No clienteId, returning defaults')
        return { 
          wms_habilitado: false, 
          tms_habilitado: false,
          ecommerce_habilitado: false,
          atendimento_habilitado: false
        }
      }

      console.log('[useClienteModulos] Fetching modules for clienteId:', clienteId)
      
      const { data, error } = await supabase
        .from("clientes")
        .select("wms_habilitado, tms_habilitado, ecommerce_habilitado, atendimento_habilitado")
        .eq("id", clienteId)
        .single()

      if (error) {
        console.error('[useClienteModulos] Error fetching modules:', error)
        throw error
      }

      console.log('[useClienteModulos] Fetched modules:', data)

      return {
        wms_habilitado: data?.wms_habilitado ?? false,
        tms_habilitado: data?.tms_habilitado ?? false,
        ecommerce_habilitado: data?.ecommerce_habilitado ?? false,
        atendimento_habilitado: data?.atendimento_habilitado ?? false
      }
    },
    enabled: !!clienteId,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
  })

  const updateModulos = useMutation({
    mutationFn: async (updates: Partial<ClienteModulos>) => {
      if (!clienteId) throw new Error("Nenhum cliente selecionado")

      console.log('[useClienteModulos] Updating modules for clienteId:', clienteId, 'updates:', updates)

      const { data, error } = await supabase
        .from("clientes")
        .update(updates)
        .eq("id", clienteId)
        .select("id, wms_habilitado, tms_habilitado, ecommerce_habilitado, atendimento_habilitado")

      if (error) {
        console.error('[useClienteModulos] Update error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.error('[useClienteModulos] No rows updated - RLS might be blocking')
        throw new Error("Não foi possível atualizar. Verifique suas permissões.")
      }

      console.log('[useClienteModulos] Update successful:', data)
      return data[0]
    },
    onSuccess: (data) => {
      // Update cache with returned data
      queryClient.setQueryData(["cliente-modulos", clienteId], {
        wms_habilitado: data.wms_habilitado,
        tms_habilitado: data.tms_habilitado,
        ecommerce_habilitado: data.ecommerce_habilitado,
        atendimento_habilitado: data.atendimento_habilitado,
      })
      
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["cliente-modulos", clienteId] })
      
      toast({
        title: "Módulos atualizados",
        description: "As configurações de módulos foram salvas com sucesso.",
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar módulos:", error)
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
      // Refetch to get current state
      refetch()
    }
  })

  return {
    wmsHabilitado: modulos?.wms_habilitado ?? false,
    tmsHabilitado: modulos?.tms_habilitado ?? false,
    ecommerceHabilitado: modulos?.ecommerce_habilitado ?? false,
    atendimentoHabilitado: modulos?.atendimento_habilitado ?? false,
    isLoading,
    updateModulos: updateModulos.mutate,
    isUpdating: updateModulos.isPending,
    refetch
  }
}
