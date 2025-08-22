import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export const useUpdateNotificationView = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationType: string) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("user_notification_views")
        .upsert({
          user_id: user.id,
          notification_type: notificationType,
          last_viewed_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,notification_type"
        })

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate notifications query to refresh counts
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}