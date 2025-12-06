import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"
import { useToast } from "@/hooks/use-toast"

interface ClienteModulos {
  wms_habilitado: boolean
  tms_habilitado: boolean
}

export const useClienteModulos = () => {
  const { selectedCliente } = useCliente()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: modulos, isLoading } = useQuery({
    queryKey: ["cliente-modulos", selectedCliente?.id],
    queryFn: async (): Promise<ClienteModulos> => {
      if (!selectedCliente?.id) {
        return { wms_habilitado: false, tms_habilitado: false }
      }

      const { data, error } = await supabase
        .from("clientes")
        .select("wms_habilitado, tms_habilitado")
        .eq("id", selectedCliente.id)
        .single()

      if (error) throw error

      return {
        wms_habilitado: data?.wms_habilitado ?? false,
        tms_habilitado: data?.tms_habilitado ?? false
      }
    },
    enabled: !!selectedCliente?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const updateModulos = useMutation({
    mutationFn: async (updates: Partial<ClienteModulos>) => {
      if (!selectedCliente?.id) throw new Error("Nenhum cliente selecionado")

      const { error } = await supabase
        .from("clientes")
        .update(updates)
        .eq("id", selectedCliente.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-modulos", selectedCliente?.id] })
      toast({
        title: "Módulos atualizados",
        description: "As configurações de módulos foram salvas com sucesso.",
      })
    },
    onError: (error) => {
      console.error("Erro ao atualizar módulos:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    }
  })

  return {
    wmsHabilitado: modulos?.wms_habilitado ?? false,
    tmsHabilitado: modulos?.tms_habilitado ?? false,
    isLoading,
    updateModulos: updateModulos.mutate,
    isUpdating: updateModulos.isPending
  }
}
