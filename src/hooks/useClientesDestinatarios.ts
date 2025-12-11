import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCliente } from "@/contexts/ClienteContext"

export interface ClienteDestinatario {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cpf_cnpj: string
  tipo_cliente: string
  endereco_fiscal: string | null
  numero_fiscal: string | null
  complemento_fiscal: string | null
  bairro_fiscal: string | null
  cidade_fiscal: string | null
  estado_fiscal: string | null
  cep_fiscal: string | null
  inscricao_estadual: string | null
  telefone_comercial: string | null
  email_comercial: string | null
}

/**
 * Hook para buscar clientes destinatários para saída/venda
 * Busca os clientes vinculados à empresa selecionada no header
 */
export const useClientesDestinatarios = () => {
  const { selectedCliente: empresaSelecionada } = useCliente()
  
  return useQuery({
    queryKey: ["clientes-destinatarios", empresaSelecionada?.id],
    queryFn: async (): Promise<ClienteDestinatario[]> => {
      if (!empresaSelecionada?.id) return []
      
      // Buscar clientes vinculados à empresa via empresa_clientes
      const { data, error } = await supabase
        .from("empresa_clientes")
        .select(`
          cliente:clientes!empresa_clientes_cliente_id_fkey (
            id,
            razao_social,
            nome_fantasia,
            cpf_cnpj,
            tipo_cliente,
            endereco_fiscal,
            numero_fiscal,
            complemento_fiscal,
            bairro_fiscal,
            cidade_fiscal,
            estado_fiscal,
            cep_fiscal,
            inscricao_estadual,
            telefone_comercial,
            email_comercial
          )
        `)
        .eq("empresa_id", empresaSelecionada.id)
        .eq("ativo", true)

      if (error) {
        console.error("Erro ao buscar clientes destinatários:", error)
        throw error
      }
      
      // Extrair clientes do resultado
      return (data || [])
        .map(ec => ec.cliente as unknown as ClienteDestinatario)
        .filter(c => c !== null)
    },
    enabled: !!empresaSelecionada?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
