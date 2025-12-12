import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { TabelaFrete } from "./useTabelasFrete"

export interface TransportadoraPlataforma {
  cliente_id: string
  razao_social: string
  cnpj: string
  tem_tabelas_frete: boolean
}

export const useBuscarTransportadoraPlataforma = () => {
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<TransportadoraPlataforma | null>(null)
  const [tabelas, setTabelas] = useState<TabelaFrete[]>([])

  const buscarPorCnpj = async (cnpj: string) => {
    setBuscando(true)
    setResultado(null)
    setTabelas([])

    try {
      const { data, error } = await supabase.rpc('buscar_transportadora_plataforma', {
        p_cnpj: cnpj
      })

      if (error) throw error

      if (data && data.length > 0) {
        const transportadora = data[0] as TransportadoraPlataforma
        setResultado(transportadora)

        // Se tem tabelas de frete, buscar
        if (transportadora.tem_tabelas_frete) {
          const { data: tabelasData, error: tabelasError } = await supabase.rpc(
            'buscar_tabelas_transportadora',
            { p_cliente_id: transportadora.cliente_id }
          )

          if (!tabelasError && tabelasData) {
            setTabelas(tabelasData as TabelaFrete[])
          }
        }

        return transportadora
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar transportadora:', error)
      throw error
    } finally {
      setBuscando(false)
    }
  }

  const limpar = () => {
    setResultado(null)
    setTabelas([])
  }

  return {
    buscarPorCnpj,
    limpar,
    buscando,
    resultado,
    tabelas
  }
}
