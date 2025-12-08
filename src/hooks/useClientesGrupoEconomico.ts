import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface ClienteGrupo {
  id: string
  razao_social: string
  cpf_cnpj: string
  cidade_fiscal: string | null
  estado_fiscal: string | null
  tipo: 'matriz' | 'filial'
}

export function useClientesGrupoEconomico(clienteOrigemId?: string) {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["clientes-grupo-economico", clienteOrigemId, user?.id],
    queryFn: async (): Promise<ClienteGrupo[]> => {
      if (!user?.id) return []
      
      // First, get the user's cliente associations to find the origem
      const { data: clienteUsuarios } = await supabase
        .from("cliente_usuarios")
        .select("cliente_id")
        .eq("user_id", user.id)
        .eq("ativo", true)
      
      if (!clienteUsuarios || clienteUsuarios.length === 0) return []
      
      const clienteIds = clienteUsuarios.map(cu => cu.cliente_id)
      
      // Get all clientes for these associations
      const { data: clientes } = await supabase
        .from("clientes")
        .select("id, razao_social, cpf_cnpj, cidade_fiscal, estado_fiscal, empresa_matriz_id")
        .in("id", clienteIds)
        .eq("ativo", true)
      
      if (!clientes || clientes.length === 0) return []
      
      // Find matriz IDs (either the cliente itself if it has no empresa_matriz_id, or its matriz)
      const matrizIds = new Set<string>()
      clientes.forEach(c => {
        if (c.empresa_matriz_id) {
          matrizIds.add(c.empresa_matriz_id)
        } else {
          matrizIds.add(c.id)
        }
      })
      
      // Get all clientes in the economic group (matriz + filiais)
      const { data: grupoEconomico } = await supabase
        .from("clientes")
        .select("id, razao_social, cpf_cnpj, cidade_fiscal, estado_fiscal, empresa_matriz_id")
        .or(`id.in.(${Array.from(matrizIds).join(',')}),empresa_matriz_id.in.(${Array.from(matrizIds).join(',')})`)
        .eq("ativo", true)
      
      if (!grupoEconomico) return []
      
      // Filter out the origem client if provided
      const filteredClientes = clienteOrigemId 
        ? grupoEconomico.filter(c => c.id !== clienteOrigemId)
        : grupoEconomico
      
      // Map to result format with tipo indicator
      return filteredClientes.map(c => ({
        id: c.id,
        razao_social: c.razao_social,
        cpf_cnpj: c.cpf_cnpj,
        cidade_fiscal: c.cidade_fiscal,
        estado_fiscal: c.estado_fiscal,
        tipo: c.empresa_matriz_id ? 'filial' as const : 'matriz' as const
      }))
    },
    enabled: !!user?.id,
  })
}
