import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface ProfileData {
  user_id: string
  nome: string
  email: string
}

export const useProfilesForSaidas = (saidas: any[] = []) => {
  return useQuery({
    queryKey: ["profiles-for-saidas", saidas.map(s => s.id).join(',')],
    queryFn: async (): Promise<{
      criadores: Record<string, ProfileData>
      destinatarios: Record<string, ProfileData>
    }> => {
      if (saidas.length === 0) {
        return { criadores: {}, destinatarios: {} }
      }

      // Coletar todos os user_ids únicos
      const userIds = new Set<string>()
      const produtorDestinatarioIds = new Set<string>()

      saidas.forEach(saida => {
        if (saida.user_id) userIds.add(saida.user_id)
        if (saida.produtor_destinatario_id) produtorDestinatarioIds.add(saida.produtor_destinatario_id)
      })

      const allUserIds = [...userIds, ...produtorDestinatarioIds]

      if (allUserIds.length === 0) {
        return { criadores: {}, destinatarios: {} }
      }

      // Buscar os perfis
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .in("user_id", allUserIds)

      if (error) {
        throw error
      }

      // Organizar os dados
      const criadores: Record<string, ProfileData> = {}
      const destinatarios: Record<string, ProfileData> = {}

      profiles?.forEach(profile => {
        if (userIds.has(profile.user_id)) {
          criadores[profile.user_id] = profile
        }
        if (produtorDestinatarioIds.has(profile.user_id)) {
          destinatarios[profile.user_id] = profile
        }
      })

      return { criadores, destinatarios }
    },
    enabled: saidas.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}