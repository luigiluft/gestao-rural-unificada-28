import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { NFData } from "@/components/Entradas/NFParser"

interface DeteccaoEntrada {
  depositoId: string | null
  depositoNome: string | null
  tipoEntrada: 'filial_cliente' | 'armazem_geral' | 'nao_detectado'
  motivoDeteccao: string
  clienteId?: string
  clienteNome?: string
}

export const useDetectarTipoEntrada = (nfData?: NFData | null) => {
  return useQuery<DeteccaoEntrada>({
    queryKey: ["detectar-tipo-entrada", nfData?.destinatario?.cpfCnpj, nfData?.entrega?.cnpj, nfData?.itens?.[0]?.cfop],
    queryFn: async () => {
      if (!nfData) {
        return {
          depositoId: null,
          depositoNome: null,
          tipoEntrada: 'nao_detectado',
          motivoDeteccao: 'Dados da NF-e não disponíveis'
        }
      }

      const destinatarioCnpj = nfData.destinatario?.cpfCnpj?.replace(/[^\d]/g, '')
      const entregaCnpj = nfData.entrega?.cnpj?.replace(/[^\d]/g, '')
      const cfop = nfData.itens?.[0]?.cfop // Pega o CFOP do primeiro item
      
      console.log('🔍 Detectando tipo de entrada:', {
        destinatarioCnpj,
        entregaCnpj,
        cfop
      })

      // CASO 1: Verificar se destinatário é CNPJ de FILIAL de cliente
      if (destinatarioCnpj) {
        const { data: filialCliente, error: errorFilial } = await supabase
          .from("clientes")
          .select(`
            id,
            razao_social,
            cliente_depositos!inner (
              id,
              franquia_id,
              nome,
              franquias (
                id,
                nome
              )
            )
          `)
          .eq("cpf_cnpj", destinatarioCnpj)
          .eq("ativo", true)
          .not("empresa_matriz_id", "is", null) // É uma filial
          .maybeSingle()

        if (!errorFilial && filialCliente?.cliente_depositos?.[0]) {
          const deposito = filialCliente.cliente_depositos[0]
          console.log('✅ Detectado: Filial de cliente', filialCliente)
          
          return {
            depositoId: deposito.franquia_id,
            depositoNome: deposito.franquias?.nome || deposito.nome,
            tipoEntrada: 'filial_cliente',
            motivoDeteccao: `Filial "${filialCliente.razao_social}" registrada no depósito "${deposito.franquias?.nome || deposito.nome}"`,
            clienteId: filialCliente.id,
            clienteNome: filialCliente.razao_social
          }
        }
      }

      // CASO 2: Verificar se destinatário é CNPJ de DEPÓSITO (franquia) + CFOP 5.905 ou 6.905
      const isArmazemGeralCfop = cfop === '5905' || cfop === '6905'
      
      if (destinatarioCnpj && isArmazemGeralCfop) {
        const { data: franquia, error: errorFranquia } = await supabase
          .from("franquias")
          .select("id, nome, cnpj")
          .eq("ativo", true)
          .eq("cnpj", destinatarioCnpj)
          .maybeSingle()

        if (!errorFranquia && franquia) {
          console.log('✅ Detectado: Armazém Geral (destinatário = depósito)', franquia)
          
          return {
            depositoId: franquia.id,
            depositoNome: franquia.nome,
            tipoEntrada: 'armazem_geral',
            motivoDeteccao: `NF-e com CFOP ${cfop} (Armazém Geral) para depósito "${franquia.nome}"`
          }
        }
      }

      // CASO 3: Verificar se destinatário é MATRIZ de cliente, mas campo ENTREGA tem CNPJ de depósito + CFOP 5.905 ou 6.905
      if (destinatarioCnpj && entregaCnpj && isArmazemGeralCfop) {
        // Verificar se destinatário é uma matriz de cliente
        const { data: matrizCliente } = await supabase
          .from("clientes")
          .select("id, razao_social")
          .eq("cpf_cnpj", destinatarioCnpj)
          .eq("ativo", true)
          .is("empresa_matriz_id", null) // É uma matriz
          .maybeSingle()

        if (matrizCliente) {
          // Verificar se o CNPJ de entrega é de um depósito
          const { data: franquiaEntrega, error: errorFranquiaEntrega } = await supabase
            .from("franquias")
            .select("id, nome, cnpj")
            .eq("ativo", true)
            .eq("cnpj", entregaCnpj)
            .maybeSingle()

          if (!errorFranquiaEntrega && franquiaEntrega) {
            console.log('✅ Detectado: Armazém Geral (entrega = depósito)', {
              matrizCliente,
              franquiaEntrega
            })
            
            return {
              depositoId: franquiaEntrega.id,
              depositoNome: franquiaEntrega.nome,
              tipoEntrada: 'armazem_geral',
              motivoDeteccao: `NF-e com CFOP ${cfop} (Armazém Geral) para matriz "${matrizCliente.razao_social}", entrega no depósito "${franquiaEntrega.nome}"`,
              clienteId: matrizCliente.id,
              clienteNome: matrizCliente.razao_social
            }
          }
        }
      }

      // Nenhum caso detectado
      console.log('⚠️ Tipo de entrada não detectado automaticamente')
      return {
        depositoId: null,
        depositoNome: null,
        tipoEntrada: 'nao_detectado',
        motivoDeteccao: 'Não foi possível detectar automaticamente. Selecione manualmente o depósito.'
      }
    },
    enabled: !!nfData,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
