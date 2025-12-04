import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface LojaParceira {
  id: string
  cliente_id: string
  nome_loja: string
  slug: string
  logo_url: string | null
  descricao: string | null
}

export const useLojasParceiras = () => {
  return useQuery({
    queryKey: ["lojas-parceiras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_configuracao")
        .select("id, cliente_id, nome_loja, slug, logo_url, descricao")
        .eq("loja_habilitada", true)
        .not("slug", "is", null)
        .order("nome_loja", { ascending: true })

      if (error) throw error
      return data as LojaParceira[]
    },
  })
}
