import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface PendingInvite {
  id: string
  email: string
  role: string
  created_at: string
  inviter_user_id: string
  parent_user_id: string | null
  franquia_id: string | null
  permissions: string[] | null
  used_at: string | null
  franquia_nome?: string
}

export const usePendingInvites = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const pendingInvitesQuery = useQuery({
    queryKey: ["pending-invites", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<PendingInvite[]> => {
      const { data, error } = await supabase
        .from("pending_invites")
        .select(`
          id,
          email,
          role,
          created_at,
          inviter_user_id,
          parent_user_id,
          franquia_id,
          permissions,
          used_at,
          franquias (
            nome
          )
        `)
        .eq("inviter_user_id", user!.id)
        .is("used_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((invite: any) => ({
        ...invite,
        franquia_nome: invite.franquias?.nome
      }))
    }
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("pending_invites")
        .delete()
        .eq("id", inviteId)
        .eq("inviter_user_id", user?.id) // Security: only allow canceling own invites

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Convite cancelado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar convite: ${error.message}`)
    }
  })

  const resendInviteMutation = useMutation({
    mutationFn: async (invite: PendingInvite) => {
      // Call the edge function to resend the invite
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: invite.email,
          inviter_user_id: user?.id,
          parent_user_id: invite.parent_user_id,
          role: invite.role,
          permissions: invite.permissions,
          franquia_id: invite.franquia_id,
          resend: true
        }
      })

      if (error) throw new Error(`Erro na função: ${error.message}`)
      if (!data?.success) throw new Error(data?.error || 'Erro ao reenviar convite')

      return data
    },
    onSuccess: () => {
      toast.success("Convite reenviado com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reenviar convite: ${error.message}`)
    }
  })

  return {
    pendingInvites: pendingInvitesQuery.data || [],
    isLoading: pendingInvitesQuery.isLoading,
    refetch: pendingInvitesQuery.refetch,
    cancelInvite: cancelInviteMutation.mutate,
    isCanceling: cancelInviteMutation.isPending,
    resendInvite: resendInviteMutation.mutate,
    isResending: resendInviteMutation.isPending
  }
}