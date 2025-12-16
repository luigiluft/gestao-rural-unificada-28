import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { FreteFaixa } from "./useTabelasFrete"

export interface ResultadoFreteTabela {
  tabela_id: string
  tabela_nome: string
  transportadora_nome?: string
  is_propria: boolean
  faixa_aplicada: FreteFaixa
  valor_frete: number
  valor_pedagio: number
  valor_total: number
  prazo_entrega: number
}

export const useCalcularFreteMultiplasTabelas = () => {
  const [calculando, setCalculando] = useState(false)

  const calcularFreteTodasTabelas = async (
    cliente_id: string,
    distancia: number,
    peso: number
  ): Promise<ResultadoFreteTabela[]> => {
    setCalculando(true)
    try {
      // Buscar TODAS as tabelas ativas do cliente
      const { data: tabelas, error } = await supabase
        .from("tabelas_frete")
        .select(`
          id,
          nome,
          transportadora_id,
          transportadoras (
            nome
          ),
          frete_faixas (*)
        `)
        .eq("ativo", true)
        .eq("cliente_id", cliente_id)
        .order("nome")

      if (error) throw error
      if (!tabelas || tabelas.length === 0) {
        throw new Error("Nenhuma tabela de frete ativa encontrada")
      }

      const resultados: ResultadoFreteTabela[] = []

      // Calcular frete para cada tabela
      for (const tabela of tabelas) {
        if (!tabela.frete_faixas || tabela.frete_faixas.length === 0) continue

        // Encontrar faixa de distância aplicável
        const faixa = tabela.frete_faixas.find((f: FreteFaixa) => 
          distancia >= f.distancia_min && distancia <= f.distancia_max
        )

        if (!faixa) continue // Pular se distância não se encaixa

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

        resultados.push({
          tabela_id: tabela.id,
          tabela_nome: tabela.nome,
          transportadora_nome: (tabela.transportadoras as any)?.nome,
          is_propria: !tabela.transportadora_id,
          faixa_aplicada: faixa,
          valor_frete,
          valor_pedagio,
          valor_total,
          prazo_entrega: faixa.prazo_dias
        })
      }

      // Ordenar por valor total (do menor para o maior)
      resultados.sort((a, b) => a.valor_total - b.valor_total)

      return resultados
    } finally {
      setCalculando(false)
    }
  }

  return {
    calcularFreteTodasTabelas,
    calculando
  }
}
