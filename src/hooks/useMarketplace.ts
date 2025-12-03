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

// Hook para buscar anúncios do marketplace (de cliente_produtos)
export const useMarketplaceAnuncios = (filtros?: {
  categoria?: string
  busca?: string
  orderBy?: "preco_asc" | "preco_desc" | "recentes"
}) => {
  return useQuery({
    queryKey: ["marketplace-anuncios", filtros],
    queryFn: async () => {
      // Buscar produtos ativos no marketplace
      let query = supabase
        .from("cliente_produtos")
        .select("*")
        .eq("ativo_marketplace", true)
        .not("preco_unitario", "is", null)

      if (filtros?.categoria) {
        query = query.eq("categoria", filtros.categoria)
      }

      if (filtros?.busca) {
        query = query.or(`nome_produto.ilike.%${filtros.busca}%,descricao_anuncio.ilike.%${filtros.busca}%`)
      }

      if (filtros?.orderBy === "preco_asc") {
        query = query.order("preco_unitario", { ascending: true })
      } else if (filtros?.orderBy === "preco_desc") {
        query = query.order("preco_unitario", { ascending: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      const { data: produtos, error } = await query

      if (error) throw error

      // Buscar configurações das lojas para os produtos
      const clienteIds = [...new Set(produtos.map(p => p.cliente_id))]
      
      const { data: lojas } = await supabase
        .from("loja_configuracao")
        .select("cliente_id, nome_loja, slug, logo_url")
        .in("cliente_id", clienteIds)
        .eq("loja_habilitada", true)
        .eq("participar_marketplace", true)

      const lojaMap = new Map(lojas?.map(l => [l.cliente_id, l]) || [])

      // Mapear cliente_produtos para o formato MarketplaceAnuncio
      const anuncios = produtos
        .filter(p => lojaMap.has(p.cliente_id))
        .map(p => ({
          id: p.id,
          cliente_id: p.cliente_id,
          produto_id: p.id,
          titulo: p.nome_produto,
          descricao_anuncio: p.descricao_anuncio,
          preco_unitario: p.preco_unitario || 0,
          preco_promocional: p.preco_promocional,
          unidade_venda: p.unidade_medida,
          quantidade_minima: p.quantidade_minima || 1,
          quantidade_disponivel: null,
          imagens: (p.imagens as string[]) || [],
          tags: null,
          categoria: p.categoria,
          created_at: p.created_at || "",
          loja: lojaMap.get(p.cliente_id) || null
        }))

      return anuncios as MarketplaceAnuncio[]
    },
  })
}

// Hook para buscar produtos de uma loja específica (de cliente_produtos)
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

      // Buscar produtos ativos na loja própria
      const { data: produtos, error: produtosError } = await supabase
        .from("cliente_produtos")
        .select("*")
        .eq("cliente_id", loja.cliente_id)
        .eq("ativo_loja_propria", true)
        .not("preco_unitario", "is", null)
        .order("nome_produto", { ascending: true })

      if (produtosError) throw produtosError

      // Mapear para o formato MarketplaceAnuncio
      const anuncios = produtos.map(p => ({
        id: p.id,
        cliente_id: p.cliente_id,
        produto_id: p.id,
        titulo: p.nome_produto,
        descricao_anuncio: p.descricao_anuncio,
        preco_unitario: p.preco_unitario || 0,
        preco_promocional: p.preco_promocional,
        unidade_venda: p.unidade_medida,
        quantidade_minima: p.quantidade_minima || 1,
        quantidade_disponivel: null,
        imagens: (p.imagens as string[]) || [],
        tags: null,
        categoria: p.categoria,
        created_at: p.created_at || "",
      }))

      return {
        loja: loja as LojaPublica,
        anuncios: anuncios as MarketplaceAnuncio[],
      }
    },
    enabled: !!slug,
  })
}

// Extended type for product details with full shop info
export interface AnuncioDetalhesComLoja extends MarketplaceAnuncio {
  loja: {
    nome_loja: string
    slug: string
    logo_url: string | null
    whatsapp: string | null
    email_contato: string | null
  } | null
}

// Hook para buscar detalhes de um produto
export const useAnuncioDetalhes = (produtoId: string) => {
  return useQuery({
    queryKey: ["anuncio-detalhes", produtoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_produtos")
        .select("*")
        .eq("id", produtoId)
        .single()

      if (error) throw error

      // Buscar loja
      const { data: loja } = await supabase
        .from("loja_configuracao")
        .select("nome_loja, slug, logo_url, whatsapp, email_contato")
        .eq("cliente_id", data.cliente_id)
        .single()

      return {
        id: data.id,
        cliente_id: data.cliente_id,
        produto_id: data.id,
        titulo: data.nome_produto,
        descricao_anuncio: data.descricao_anuncio,
        preco_unitario: data.preco_unitario || 0,
        preco_promocional: data.preco_promocional,
        unidade_venda: data.unidade_medida,
        quantidade_minima: data.quantidade_minima || 1,
        quantidade_disponivel: null,
        imagens: (data.imagens as string[]) || [],
        tags: null,
        categoria: data.categoria,
        created_at: data.created_at || "",
        loja: loja || null
      } as AnuncioDetalhesComLoja
    },
    enabled: !!produtoId,
  })
}
