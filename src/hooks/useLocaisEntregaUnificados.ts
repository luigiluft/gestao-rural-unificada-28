import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export type TipoLocalUnificado = 'fazenda' | 'deposito' | 'local_entrega'

export interface LocalEntregaUnificado {
  id: string
  nome: string
  tipo: TipoLocalUnificado
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  latitude?: number
  longitude?: number
  area_hectares?: number
}

/**
 * Hook para buscar todos os locais de entrega de um cliente de forma unificada
 * Inclui: fazendas, depósitos (cliente_depositos) e locais_entrega
 */
export const useLocaisEntregaUnificados = (clienteId?: string) => {
  return useQuery({
    queryKey: ["locais-entrega-unificados", clienteId],
    queryFn: async (): Promise<LocalEntregaUnificado[]> => {
      if (!clienteId) return []

      const locaisUnificados: LocalEntregaUnificado[] = []

      // 1. Buscar fazendas do cliente
      const { data: fazendas } = await supabase
        .from("fazendas")
        .select("id, nome, cidade, estado, cep, latitude, longitude, area_total_ha, cliente_id")
        .eq("ativo", true)
        .or(`produtor_id.eq.${clienteId},cliente_id.eq.${clienteId}`)
        .order("nome")

      if (fazendas) {
        fazendas.forEach(f => {
          locaisUnificados.push({
            id: f.id,
            nome: f.nome,
            tipo: 'fazenda',
            cidade: f.cidade,
            estado: f.estado,
            cep: f.cep,
            latitude: f.latitude,
            longitude: f.longitude,
            area_hectares: f.area_total_ha
          })
        })
      }

      // 2. Buscar depósitos do cliente
      const { data: depositos, error: depositosError } = await supabase
        .from("cliente_depositos")
        .select(`
          id,
          nome,
          franquias (
            cidade, 
            estado, 
            cep, 
            latitude, 
            longitude,
            endereco,
            numero,
            bairro
          )
        `)
        .eq("cliente_id", clienteId)
        .eq("ativo", true)
        .order("nome")

      console.log('[useLocaisEntregaUnificados] clienteId:', clienteId)
      console.log('[useLocaisEntregaUnificados] depositos:', depositos, 'error:', depositosError)

      if (depositos) {
        depositos.forEach(d => {
          const franquia = d.franquias as any
          // Construir endereço completo a partir dos dados da franquia
          const enderecoCompleto = franquia ? 
            [franquia.endereco, franquia.numero, franquia.bairro, franquia.cidade, franquia.estado, franquia.cep]
              .filter(Boolean)
              .join(', ') : undefined
          
          locaisUnificados.push({
            id: d.id,
            nome: d.nome,
            tipo: 'deposito',
            endereco: enderecoCompleto,
            cidade: franquia?.cidade,
            estado: franquia?.estado,
            cep: franquia?.cep,
            latitude: franquia?.latitude,
            longitude: franquia?.longitude
          })
        })
      }

      // 3. Buscar locais de entrega do cliente
      const { data: locaisEntrega } = await supabase
        .from("locais_entrega")
        .select("id, nome, cidade, estado, cep, latitude, longitude, area_total_ha, endereco")
        .eq("cliente_id", clienteId)
        .eq("ativo", true)
        .order("nome")

      if (locaisEntrega) {
        locaisEntrega.forEach(l => {
          locaisUnificados.push({
            id: l.id,
            nome: l.nome,
            tipo: 'local_entrega',
            endereco: l.endereco,
            cidade: l.cidade,
            estado: l.estado,
            cep: l.cep,
            latitude: l.latitude,
            longitude: l.longitude,
            area_hectares: l.area_total_ha
          })
        })
      }

      return locaisUnificados
    },
    enabled: !!clienteId,
  })
}
