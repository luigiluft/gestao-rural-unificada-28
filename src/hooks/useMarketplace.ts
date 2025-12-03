import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface MarketplaceAnuncio {
  id: string
  cliente_id: string
  produto_id: string | null
  titulo: string
  descricao_anuncio: string | null
  preco_unitario: number
  preco_promocional: number | null
  unidade_venda: string
  quantidade_minima: number
  quantidade_disponivel: number | null
  imagens: string[]
  tags: string[] | null
  categoria: string | null
  created_at: string
  loja?: {
    nome_loja: string
    slug: string
    logo_url: string | null
  } | null
}

export interface LojaPublica {
  id: string
  cliente_id: string
  nome_loja: string
  slug: string
  descricao: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp: string | null
  email_contato: string | null
  horario_atendimento: string | null
  mostrar_endereco: boolean
  mostrar_telefone: boolean
}

// Hook para buscar anúncios do marketplace
export const useMarketplaceAnuncios = (filtros?: {
  categoria?: string
  busca?: string
  orderBy?: "preco_asc" | "preco_desc" | "recentes"
}) => {
  return useQuery({
    queryKey: ["marketplace-anuncios", filtros],
    queryFn: async () => {
      // Primeiro buscar anúncios ativos visíveis no marketplace
      let query = supabase
        .from("loja_anuncios")
        .select("*")
        .eq("ativo", true)
        .eq("visivel_marketplace", true)

      if (filtros?.categoria) {
        query = query.eq("categoria", filtros.categoria)
      }

      if (filtros?.busca) {
        query = query.or(`titulo.ilike.%${filtros.busca}%,descricao_anuncio.ilike.%${filtros.busca}%`)
      }

      if (filtros?.orderBy === "preco_asc") {
        query = query.order("preco_unitario", { ascending: true })
      } else if (filtros?.orderBy === "preco_desc") {
        query = query.order("preco_unitario", { ascending: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data: anuncios, error } = await query

      if (error) throw error

      // Buscar configurações das lojas para os anúncios
      const clienteIds = [...new Set(anuncios.map(a => a.cliente_id))]
      
      const { data: lojas } = await supabase
        .from("loja_configuracao")
        .select("cliente_id, nome_loja, slug, logo_url")
        .in("cliente_id", clienteIds)
        .eq("loja_habilitada", true)
        .eq("participar_marketplace", true)

      const lojaMap = new Map(lojas?.map(l => [l.cliente_id, l]) || [])

      // Filtrar apenas anúncios de lojas que participam do marketplace
      const anunciosComLoja = anuncios
        .filter(a => lojaMap.has(a.cliente_id))
        .map(a => ({
          ...a,
          imagens: (a.imagens as string[]) || [],
          loja: lojaMap.get(a.cliente_id) || null
        }))

      return anunciosComLoja as MarketplaceAnuncio[]
    },
  })
}

// Hook para buscar anúncios de uma loja específica
export const useLojaAnunciosPublicos = (slug: string) => {
  return useQuery({
    queryKey: ["loja-anuncios-publicos", slug],
    queryFn: async () => {
      // Primeiro buscar a configuração da loja
      const { data: loja, error: lojaError } = await supabase
        .from("loja_configuracao")
        .select("*")
        .eq("slug", slug)
        .eq("loja_habilitada", true)
        .single()

      if (lojaError) throw lojaError

      // Depois buscar os anúncios
      const { data: anuncios, error: anunciosError } = await supabase
        .from("loja_anuncios")
        .select("*")
        .eq("cliente_id", loja.cliente_id)
        .eq("ativo", true)
        .eq("visivel_loja_propria", true)
        .order("created_at", { ascending: false })

      if (anunciosError) throw anunciosError

      return {
        loja: loja as LojaPublica,
        anuncios: anuncios.map(a => ({
          ...a,
          imagens: (a.imagens as string[]) || []
        })) as MarketplaceAnuncio[],
      }
    },
    enabled: !!slug,
  })
}

// Hook para buscar detalhes de um anúncio
export const useAnuncioDetalhes = (anuncioId: string) => {
  return useQuery({
    queryKey: ["anuncio-detalhes", anuncioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loja_anuncios")
        .select("*")
        .eq("id", anuncioId)
        .eq("ativo", true)
        .single()

      if (error) throw error

      // Buscar loja
      const { data: loja } = await supabase
        .from("loja_configuracao")
        .select("nome_loja, slug, logo_url, whatsapp, email_contato")
        .eq("cliente_id", data.cliente_id)
        .single()

      return {
        ...data,
        imagens: (data.imagens as string[]) || [],
        loja: loja || null
      } as MarketplaceAnuncio
    },
    enabled: !!anuncioId,
  })
}
