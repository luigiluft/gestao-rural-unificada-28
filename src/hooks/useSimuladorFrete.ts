import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { FreteFaixa } from "./useTabelasFrete"
import { calculateDistance, type Coordinates } from "@/services/routingService"

export interface SimulacaoFrete {
  franqueado_id?: string
  origem: string
  destino: string
  distancia: string
  peso: string
  resultado?: {
    faixa_aplicada: FreteFaixa
    tabela_nome: string
    valor_frete: number
    valor_pedagio: number
    valor_total: number
    prazo_entrega: number
  }
}

export const useSimuladorFrete = () => {
  const [simulacao, setSimulacao] = useState<SimulacaoFrete>({
    origem: '',
    destino: '',
    distancia: '',
    peso: '',
  })
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

  const calcularFrete = async (franqueado_id?: string) => {
    if (!simulacao.distancia || !simulacao.peso) return

    const distancia = parseFloat(simulacao.distancia)
    const peso = parseFloat(simulacao.peso)

    // Buscar tabela do franqueado específico ou primeira ativa
    const query = supabase
      .from("tabelas_frete")
      .select(`
        *,
        frete_faixas (*)
      `)
      .eq("ativo", true)

    if (franqueado_id) {
      query.eq("franqueado_id", franqueado_id)
    }

    const { data: tabelas, error } = await query.maybeSingle()

    if (error || !tabelas) {
      throw new Error("Nenhuma tabela de frete encontrada")
    }

    // Encontrar faixa de distância aplicável
    const faixa = tabelas.frete_faixas?.find((f: FreteFaixa) => 
      distancia >= f.distancia_min && distancia <= f.distancia_max
    )

    if (!faixa) {
      throw new Error("Distância fora das faixas cadastradas")
    }

    // Calcular valor do frete
    let valor_frete: number
    if (peso <= 300) {
      valor_frete = faixa.valor_ate_300kg
    } else {
      // Para pesos acima de 300kg, usar valor por kg
      valor_frete = peso * faixa.valor_por_kg_301_999
    }

    // Calcular pedágio (por tonelada)
    const toneladas = peso / 1000
    const valor_pedagio = toneladas * faixa.pedagio_por_ton

    const valor_total = valor_frete + valor_pedagio

    const resultado = {
      faixa_aplicada: faixa,
      tabela_nome: tabelas.nome,
      valor_frete,
      valor_pedagio,
      valor_total,
      prazo_entrega: faixa.prazo_dias
    }

    setSimulacao(prev => ({ ...prev, resultado }))
    return resultado
  }

  const calcularDistanciaAutomatica = async (
    franquiaCoords: Coordinates,
    fazendaCoords: Coordinates
  ) => {
    setIsCalculatingDistance(true)
    try {
      const distancia = await calculateDistance(franquiaCoords, fazendaCoords)
      setSimulacao(prev => ({ 
        ...prev, 
        distancia: distancia.toString() 
      }))
      return distancia
    } catch (error) {
      console.error('Erro ao calcular distância:', error)
      throw error
    } finally {
      setIsCalculatingDistance(false)
    }
  }

  return {
    simulacao,
    setSimulacao,
    calcularFrete,
    calcularDistanciaAutomatica,
    isCalculatingDistance
  }
}