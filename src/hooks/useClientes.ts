import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export interface Cliente {
  id: string
  tipo_cliente: 'cpf' | 'cnpj'
  razao_social: string
  nome_fantasia: string | null
  cpf_cnpj: string
  inscricao_estadual: string | null
  endereco_fiscal: string | null
  numero_fiscal: string | null
  complemento_fiscal: string | null
  bairro_fiscal: string | null
  cidade_fiscal: string | null
  estado_fiscal: string | null
  cep_fiscal: string | null
  telefone_comercial: string | null
  email_comercial: string | null
  atividade_principal: string | null
  regime_tributario: string | null
  observacoes: string | null
  latitude: number | null
  longitude: number | null
  ativo: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ClienteWithRole extends Cliente {
  papel?: string
}

/**
 * Hook para buscar todos os clientes do usuário logado
 */
export const useClientes = () => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ["clientes", user?.id],
    queryFn: async (): Promise<ClienteWithRole[]> => {
      if (!user?.id) return []
      
      // Buscar clientes através da tabela de relacionamento
      const { data: clienteUsuarios, error: clienteUsuariosError } = await supabase
        .from("cliente_usuarios")
        .select(`
          papel,
          clientes (*)
        `)
        .eq("user_id", user.id)
        .eq("ativo", true)

      if (clienteUsuariosError) {
        console.error("Erro ao carregar clientes para o usuário logado:", clienteUsuariosError)
        throw clienteUsuariosError
      }
      
      // Transformar resultado para incluir o papel
      return (clienteUsuarios || []).map(cu => ({
        ...(cu.clientes as Cliente),
        papel: cu.papel
      })) as ClienteWithRole[]
    },
    enabled: !!user?.id,
  })
}

/**
 * Hook para buscar um cliente específico por ID
 */
export const useCliente = (clienteId?: string) => {
  return useQuery({
    queryKey: ["cliente", clienteId],
    queryFn: async (): Promise<Cliente | null> => {
      if (!clienteId) return null
      
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", clienteId)
        .single()

      if (error) throw error
      return data as Cliente | null
    },
    enabled: !!clienteId,
  })
}

/**
 * Hook para criar um novo cliente
 */
export const useCreateCliente = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: async (data: Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'ativo'>) => {
      if (!user?.id) throw new Error("Usuário não autenticado")
      
      // Validar que endereço é obrigatório
      if (!data.endereco_fiscal || !data.cidade_fiscal || !data.estado_fiscal) {
        throw new Error("Endereço fiscal é obrigatório (logradouro, cidade e estado)")
      }
      
      // Criar o cliente
      const { data: cliente, error: clienteError } = await supabase
        .from("clientes")
        .insert({
          ...data,
          created_by: user.id,
          ativo: true
        })
        .select()
        .single() as { data: Cliente | null, error: any }

      if (clienteError) throw clienteError
      
      if (!cliente) throw new Error("Erro ao criar cliente")
      
      // Vincular o criador como administrador do cliente
      const { error: vinculoError } = await supabase
        .from("cliente_usuarios")
        .insert({
          cliente_id: cliente.id,
          user_id: user.id,
          papel: 'administrador',
          created_by: user.id
        })

      if (vinculoError) throw vinculoError
      
      // Criar local de entrega "Matriz" automaticamente
      const endereco_completo = [
        cliente.endereco_fiscal,
        cliente.numero_fiscal,
        cliente.complemento_fiscal
      ].filter(Boolean).join(', ')

      const { error: localError } = await supabase
        .from("locais_entrega")
        .insert({
          nome: `Matriz - ${cliente.nome_fantasia || cliente.razao_social}`,
          tipo_local: 'filial',
          is_rural: false,
          endereco: endereco_completo,
          bairro: cliente.bairro_fiscal || '',
          cidade: cliente.cidade_fiscal!,
          estado: cliente.estado_fiscal!,
          cep: cliente.cep_fiscal || '',
          cliente_id: cliente.id,
          ativo: true
        })

      if (localError) {
        console.error("Erro ao criar local de entrega matriz:", localError)
        // Não impede a criação do cliente, apenas loga o erro
      }
      
      return cliente
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      queryClient.invalidateQueries({ queryKey: ["locais-entrega"] })
      toast.success("Cliente criado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao criar cliente")
    }
  })
}

/**
 * Hook para atualizar um cliente
 */
export const useUpdateCliente = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Cliente> & { id: string }) => {
      const { data: cliente, error } = await supabase
        .from("clientes")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return cliente
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      queryClient.invalidateQueries({ queryKey: ["cliente", variables.id] })
      toast.success("Cliente atualizado com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error)
      toast.error("Erro ao atualizar cliente")
    }
  })
}
