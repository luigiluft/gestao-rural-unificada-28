import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export type TipoLocal = 'fazenda' | 'filial' | 'centro_distribuicao' | 'loja' | 'armazem' | 'outro'

export interface LocalEntrega {
  id: string
  cliente_id: string
  produtor_id: string | null
  nome: string
  tipo_local: TipoLocal
  is_rural: boolean
  ativo: boolean
  endereco: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade: string
  estado: string
  cep: string
  latitude?: number
  longitude?: number
  inscricao_estadual?: string
  telefone_contato?: string
  email_contato?: string
  tipo_logradouro?: string
  nome_logradouro?: string
  municipio?: string
  codigo_ibge_municipio?: string
  uf?: string
  uf_ie?: string
  referencia?: string
  cpf_cnpj_proprietario?: string
  situacao_cadastral?: string
  codigo_imovel_rural?: string
  cadastro_ambiental_rural?: string
  area_total_ha?: number
  tipo_producao?: string
  capacidade_armazenagem_ton?: number
  infraestrutura?: string
  nome_responsavel?: string
  created_at: string
  updated_at: string
}

export const useLocaisEntrega = (clienteId?: string, produtorId?: string) => {
  return useQuery({
    queryKey: ["locais-entrega", clienteId, produtorId],
    queryFn: async () => {
      let query = supabase
        .from("locais_entrega")
        .select("*")
        .eq("ativo", true)
        .order("nome")

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }
      
      if (produtorId) {
        query = query.eq("produtor_id", produtorId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as LocalEntrega[]
    },
    enabled: !!(clienteId || produtorId),
  })
}

export const useLocalEntrega = (localId: string) => {
  return useQuery({
    queryKey: ["local-entrega", localId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locais_entrega")
        .select("*")
        .eq("id", localId)
        .maybeSingle()

      if (error) throw error
      return data as LocalEntrega | null
    },
    enabled: !!localId,
  })
}