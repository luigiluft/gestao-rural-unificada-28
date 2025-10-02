import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface ViagemMotorista {
  id: string
  numero: string
  status: string
  data_inicio: string | null
  data_fim: string | null
  total_remessas: number
  remessas_entregues: number
  peso_total: number | null
  distancia_total: number
  observacoes: string | null
  created_at: string
  updated_at: string
  veiculos?: {
    id: string
    placa: string
    modelo: string
  } | null
  deposito?: {
    id: string
    nome: string
  } | null
}

export const useMotoristaViagens = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["motorista-viagens", user?.id],
    queryFn: async (): Promise<ViagemMotorista[]> => {
      if (!user?.id) return []

      console.log("🔍 useMotoristaViagens: Buscando motorista para auth_user_id:", user.id)

      // Buscar motorista pelo auth_user_id
      const { data: motorista, error: motoristaError } = await supabase
        .from("motoristas")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (motoristaError || !motorista) {
        console.log("❌ useMotoristaViagens: Motorista não encontrado para o usuário:", user.id, motoristaError)
        return []
      }

      console.log("✅ useMotoristaViagens: Motorista encontrado:", motorista.id)

      console.log("🔍 useMotoristaViagens: Buscando viagens para motorista_id:", motorista.id)

      const { data, error } = await supabase
        .from("viagens")
        .select("*")
        .eq("motorista_id", motorista.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ useMotoristaViagens: Erro ao buscar viagens:", error)
        throw error
      }

      console.log("✅ useMotoristaViagens: Viagens encontradas:", data?.length || 0, data)

      // Buscar dados relacionados separadamente para evitar problemas de tipo
      const viagensComDados = await Promise.all((data || []).map(async (viagem) => {
        // Buscar veículo
        let veiculo = null
        if (viagem.veiculo_id) {
          const { data: veiculoData } = await supabase
            .from("veiculos")
            .select("id, placa, modelo")
            .eq("id", viagem.veiculo_id)
            .maybeSingle()
          veiculo = veiculoData
        }

        // Buscar depósito
        let deposito = null
        if (viagem.deposito_id) {
          const { data: depositoData } = await supabase
            .from("franquias")
            .select("id, nome")
            .eq("id", viagem.deposito_id)
            .maybeSingle()
          deposito = depositoData
        }

        return {
          ...viagem,
          veiculos: veiculo,
          deposito: deposito
        } as ViagemMotorista
      }))

      return viagensComDados
    },
    enabled: !!user?.id,
    staleTime: 30000,
  })
}

export const useIniciarViagem = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ viagemId, hodometroInicio, combustivelInicio }: {
      viagemId: string
      hodometroInicio?: number
      combustivelInicio?: number
    }) => {
      const { error } = await supabase
        .from("viagens")
        .update({
          status: "em_andamento",
          data_inicio: new Date().toISOString(),
          hodometro_inicio: hodometroInicio,
          combustivel_inicio: combustivelInicio,
          updated_at: new Date().toISOString()
        })
        .eq("id", viagemId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success("Viagem iniciada com sucesso!")
      console.log('🎯 Iniciando viagem - variáveis:', variables)
      
      // Invalidar queries primeiro para garantir dados atualizados
      queryClient.invalidateQueries({ queryKey: ["motorista-viagens", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["viagens-notifications", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: any) => {
      console.error("Erro ao iniciar viagem:", error)
      toast.error("Erro ao iniciar viagem: " + error.message)
    }
  })
}

export const useFinalizarViagem = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ viagemId, hodometroFim, combustivelFim, observacoes }: {
      viagemId: string
      hodometroFim?: number
      combustivelFim?: number
      observacoes?: string
    }) => {
      const { error } = await supabase
        .from("viagens")
        .update({
          status: "entregue",
          data_fim: new Date().toISOString(),
          hodometro_fim: hodometroFim,
          combustivel_fim: combustivelFim,
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq("id", viagemId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      toast.success("Viagem finalizada com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["motorista-viagens", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["viagens-notifications", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: any) => {
      console.error("Erro ao finalizar viagem:", error)
      toast.error("Erro ao finalizar viagem: " + error.message)
    }
  })
}