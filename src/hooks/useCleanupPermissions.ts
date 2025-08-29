import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useCleanupPermissions = () => {
  const cleanupSubaccountPermissionsMutation = useMutation({
    mutationFn: async () => {
      // Primeiro buscar IDs das subcontas
      const { data: subaccounts } = await supabase
        .from("user_hierarchy")
        .select("child_user_id")

      if (subaccounts && subaccounts.length > 0) {
        const subaccountIds = subaccounts.map(s => s.child_user_id)
        
        // Remover permissões individuais de todas as subcontas
        const { error } = await supabase
          .from("user_permissions")
          .delete()
          .in("user_id", subaccountIds)

        if (error) throw error
      }
      
      return true
    },
    onSuccess: () => {
      toast.success("Permissões das subcontas migradas com sucesso!")
    },
    onError: (error) => {
      console.error("Erro na limpeza de permissões:", error)
      toast.error("Erro na migração de permissões")
    }
  })

  return {
    cleanupSubaccountPermissions: cleanupSubaccountPermissionsMutation.mutate,
    isCleaningUp: cleanupSubaccountPermissionsMutation.isPending
  }
}