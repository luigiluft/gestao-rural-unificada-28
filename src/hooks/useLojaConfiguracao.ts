import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCliente } from "@/contexts/ClienteContext"
import { toast } from "sonner"

export interface LojaConfiguracao {
  id: string
  cliente_id: string
  loja_habilitada: boolean
  participar_marketplace: boolean
  nome_loja: string | null
  slug: string | null
  descricao: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp: string | null
  email_contato: string | null
  horario_atendimento: string | null
  mostrar_endereco: boolean
  mostrar_telefone: boolean
  cor_primaria: string | null
  cor_secundaria: string | null
  cor_fundo: string | null
  created_at: string
  updated_at: string
}

export const useLojaConfiguracao = () => {
  const { user } = useAuth()
  const { selectedCliente } = useCliente()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["loja-configuracao", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return null

      const { data, error } = await supabase
        .from("loja_configuracao")
        .select("*")
        .eq("cliente_id", selectedCliente.id)
        .maybeSingle()

      if (error) throw error
      return data as LojaConfiguracao | null
    },
    enabled: !!selectedCliente?.id,
  })

  const createOrUpdateMutation = useMutation({
    mutationFn: async (config: Partial<LojaConfiguracao>) => {
      if (!selectedCliente?.id) throw new Error("Cliente não selecionado")

      const payload = {
        ...config,
        cliente_id: selectedCliente.id,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("loja_configuracao")
        .upsert(payload, { onConflict: "cliente_id" })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-configuracao"] })
      toast.success("Configurações da loja salvas!")
    },
    onError: (error) => {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações da loja")
    },
  })

  const habilitarLoja = useMutation({
    mutationFn: async (dados: { 
      nome_loja: string
      participar_marketplace: boolean 
    }) => {
      if (!selectedCliente?.id) throw new Error("Cliente não selecionado")

      // Gerar slug a partir do nome
      const slug = dados.nome_loja
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const { data, error } = await supabase
        .from("loja_configuracao")
        .upsert({
          cliente_id: selectedCliente.id,
          loja_habilitada: true,
          nome_loja: dados.nome_loja,
          slug,
          participar_marketplace: dados.participar_marketplace,
          updated_at: new Date().toISOString(),
        }, { onConflict: "cliente_id" })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-configuracao"] })
      toast.success("Loja habilitada com sucesso!")
    },
    onError: (error) => {
      console.error("Erro ao habilitar loja:", error)
      toast.error("Erro ao habilitar loja")
    },
  })

  // Upload de logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCliente?.id) throw new Error("Cliente não selecionado")

      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedCliente.id}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('loja-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('loja-assets')
        .getPublicUrl(fileName)

      // Atualizar configuração com a URL
      const { error: updateError } = await supabase
        .from("loja_configuracao")
        .update({ 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("cliente_id", selectedCliente.id)

      if (updateError) throw updateError

      return publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-configuracao"] })
      toast.success("Logo atualizado!")
    },
    onError: (error) => {
      console.error("Erro ao fazer upload do logo:", error)
      toast.error("Erro ao fazer upload do logo")
    },
  })

  // Upload de banner
  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCliente?.id) throw new Error("Cliente não selecionado")

      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedCliente.id}/banner.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('loja-assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('loja-assets')
        .getPublicUrl(fileName)

      // Atualizar configuração com a URL
      const { error: updateError } = await supabase
        .from("loja_configuracao")
        .update({ 
          banner_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("cliente_id", selectedCliente.id)

      if (updateError) throw updateError

      return publicUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loja-configuracao"] })
      toast.success("Banner atualizado!")
    },
    onError: (error) => {
      console.error("Erro ao fazer upload do banner:", error)
      toast.error("Erro ao fazer upload do banner")
    },
  })

  return {
    configuracao: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    salvarConfiguracao: createOrUpdateMutation.mutate,
    isSaving: createOrUpdateMutation.isPending,
    habilitarLoja: habilitarLoja.mutate,
    isHabilitando: habilitarLoja.isPending,
    uploadLogo: uploadLogoMutation.mutate,
    isUploadingLogo: uploadLogoMutation.isPending,
    uploadBanner: uploadBannerMutation.mutate,
    isUploadingBanner: uploadBannerMutation.isPending,
  }
}
