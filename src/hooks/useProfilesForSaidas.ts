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
      console.log('🔍 useProfilesForSaidas executando com saidas:', saidas.length)
      
      if (saidas.length === 0) {
        console.log('❌ Nenhuma saída encontrada')
        return { criadores: {}, destinatarios: {} }
      }

      // Coletar todos os user_ids únicos
      const userIds = new Set<string>()
      const produtorDestinatarioIds = new Set<string>()

      saidas.forEach(saida => {
        console.log('📋 Processando saída:', { 
          id: saida.id, 
          user_id: saida.user_id, 
          produtor_destinatario_id: saida.produtor_destinatario_id 
        })
        if (saida.user_id) userIds.add(saida.user_id)
        if (saida.produtor_destinatario_id) produtorDestinatarioIds.add(saida.produtor_destinatario_id)
      })

      const allUserIds = [...userIds, ...produtorDestinatarioIds]
      console.log('👥 IDs coletados:', { 
        userIds: Array.from(userIds), 
        produtorDestinatarioIds: Array.from(produtorDestinatarioIds), 
        total: allUserIds.length 
      })

      if (allUserIds.length === 0) {
        console.log('❌ Nenhum ID de usuário encontrado')
        return { criadores: {}, destinatarios: {} }
      }

      // Buscar os perfis
      console.log('🔄 Buscando perfis para IDs:', allUserIds)
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .in("user_id", allUserIds)

      if (error) {
        console.error("❌ Erro ao buscar perfis:", error)
        return { criadores: {}, destinatarios: {} }
      }

      console.log('✅ Perfis encontrados:', profiles?.length || 0, profiles)

      // Organizar os dados
      const criadores: Record<string, ProfileData> = {}
      const destinatarios: Record<string, ProfileData> = {}

      profiles?.forEach(profile => {
        if (userIds.has(profile.user_id)) {
          criadores[profile.user_id] = profile
          console.log('👤 Criador adicionado:', profile.user_id, profile.nome)
        }
        if (produtorDestinatarioIds.has(profile.user_id)) {
          destinatarios[profile.user_id] = profile
          console.log('🎯 Destinatário adicionado:', profile.user_id, profile.nome)
        }
      })

      console.log('📊 Resultado final:', { 
        criadores: Object.keys(criadores).length, 
        destinatarios: Object.keys(destinatarios).length 
      })

      return { criadores, destinatarios }
    },
    enabled: saidas.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3, // Adicionar retry
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}