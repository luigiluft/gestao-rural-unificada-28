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
      
      // Usar RPC que bypassa RLS para buscar clientes vinculados
      const { data, error } = await supabase
        .rpc('buscar_empresa_clientes', { p_empresa_id: empresaSelecionada.id })

      if (error) {
        console.error("Erro ao buscar clientes destinatários:", error)
        throw error
      }
      
      // Mapear os campos da RPC para a interface esperada
      // A RPC retorna: cliente_id, cliente_razao_social, cliente_nome_fantasia, cliente_cpf_cnpj, cliente_email, cliente_telefone, cliente_cidade, cliente_estado
      return (data || []).map(item => ({
        id: item.cliente_id,
        razao_social: item.cliente_razao_social,
        nome_fantasia: item.cliente_nome_fantasia,
        cpf_cnpj: item.cliente_cpf_cnpj,
        tipo_cliente: item.tipo_relacionamento || 'cliente',
        endereco_fiscal: null,
        numero_fiscal: null,
        complemento_fiscal: null,
        bairro_fiscal: null,
        cidade_fiscal: item.cliente_cidade,
        estado_fiscal: item.cliente_estado,
        cep_fiscal: null,
        inscricao_estadual: null,
        telefone_comercial: item.cliente_telefone,
        email_comercial: item.cliente_email,
      })) as ClienteDestinatario[]
    },
    enabled: !!empresaSelecionada?.id,
    staleTime: 0, // Sempre buscar dados frescos
  })
}
