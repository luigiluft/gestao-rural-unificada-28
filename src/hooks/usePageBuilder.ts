import { useState, useCallback, useEffect } from 'react';
import { useCliente } from '@/contexts/ClienteContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BlocoLoja, LayoutPaginas, BLOCOS_DISPONIVEIS, PAGINAS_DISPONIVEIS } from '@/components/PageBuilder/types';

const DEFAULT_LAYOUT: LayoutPaginas = {
  home: {
    blocos: [
      { id: 'hero-1', tipo: 'hero', ordem: 0, config: { mostrarLogo: true, mostrarBanner: true } },
      { id: 'contato-1', tipo: 'contato', ordem: 1, config: { mostrarEmail: true, mostrarTelefone: true, mostrarHorario: true } },
      { id: 'tabs-1', tipo: 'tabs_navegacao', ordem: 2, config: { mostrarSpot: true, mostrarCotacao: true } },
      { id: 'busca-1', tipo: 'busca_produtos', ordem: 3, config: {} },
      { id: 'categorias-1', tipo: 'categorias', ordem: 4, config: {} },
      { id: 'produtos-1', tipo: 'grade_produtos', ordem: 5, config: { colunas: 4 } },
      { id: 'footer-1', tipo: 'footer', ordem: 6, config: { mostrarInfoLoja: true, mostrarContato: true, mostrarLinks: true } }
    ]
  }
};

interface LojaData {
  nome_loja: string;
  descricao?: string;
  logo_url?: string;
  banner_url?: string;
  email_contato?: string;
  whatsapp?: string;
  horario_atendimento?: string;
  mostrar_telefone?: boolean;
  slug?: string;
}

export function usePageBuilder() {
  const { selectedCliente } = useCliente();
  const queryClient = useQueryClient();
  const [selectedBlocoId, setSelectedBlocoId] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState<string>('home');
  const [localLayout, setLocalLayout] = useState<LayoutPaginas | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch store configuration including layout
  const { data: lojaConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['loja-configuracao-editor', selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return null;
      
      const { data, error } = await supabase
        .from('loja_configuracao')
        .select('*')
        .eq('cliente_id', selectedCliente.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCliente?.id
  });

  // Fetch store products for preview
  const { data: anuncios = [] } = useQuery({
    queryKey: ['loja-anuncios-editor', selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return [];
      
      const { data, error } = await supabase
        .from('cliente_produtos')
        .select('*')
        .eq('cliente_id', selectedCliente.id)
        .or('ativo_loja_propria.eq.true,ativo_marketplace.eq.true')
        .limit(20);

      if (error) throw error;
      return data?.map(p => ({
        id: p.id,
        titulo: p.nome_produto,
        preco_unitario: p.preco_unitario || 0,
        preco_promocional: p.preco_promocional,
        quantidade_minima: p.quantidade_minima || 1,
        unidade_venda: p.unidade_medida || 'un',
        categoria: p.categoria,
        imagens: p.imagens as string[] | null,
        descricao_anuncio: p.descricao_anuncio
      })) || [];
    },
    enabled: !!selectedCliente?.id
  });

  // Initialize local layout from database
  useEffect(() => {
    if (lojaConfig?.layout_paginas) {
      setLocalLayout(lojaConfig.layout_paginas as unknown as LayoutPaginas);
    } else {
      setLocalLayout(DEFAULT_LAYOUT);
    }
    setHasUnsavedChanges(false);
  }, [lojaConfig]);

  const layout: LayoutPaginas = localLayout || DEFAULT_LAYOUT;

  const lojaData: LojaData | undefined = lojaConfig ? {
    nome_loja: lojaConfig.nome_loja || 'Minha Loja',
    descricao: lojaConfig.descricao || undefined,
    logo_url: lojaConfig.logo_url || undefined,
    banner_url: lojaConfig.banner_url || undefined,
    email_contato: lojaConfig.email_contato || undefined,
    whatsapp: lojaConfig.whatsapp || undefined,
    horario_atendimento: lojaConfig.horario_atendimento || undefined,
    mostrar_telefone: lojaConfig.mostrar_telefone ?? true,
    slug: lojaConfig.slug || undefined
  } : undefined;

  const saveMutation = useMutation({
    mutationFn: async (newLayout: LayoutPaginas) => {
      if (!selectedCliente?.id) throw new Error('Cliente não selecionado');

      const { error } = await supabase
        .from('loja_configuracao')
        .upsert({
          cliente_id: selectedCliente.id,
          layout_paginas: newLayout as any
        }, { onConflict: 'cliente_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loja-configuracao-editor', selectedCliente?.id] });
      queryClient.invalidateQueries({ queryKey: ['loja-anuncios-publicos'] });
      setHasUnsavedChanges(false);
      toast.success('Layout salvo com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar layout');
    }
  });

  const blocos = layout[paginaAtual]?.blocos || [];

  // Manual save function
  const salvarLayout = useCallback(() => {
    if (localLayout) {
      saveMutation.mutate(localLayout);
    }
  }, [localLayout, saveMutation]);

  const adicionarBloco = useCallback((tipo: BlocoLoja['tipo']) => {
    const definicao = BLOCOS_DISPONIVEIS.find(b => b.tipo === tipo);
    if (!definicao) return;

    const novoBloco: BlocoLoja = {
      id: `${tipo}-${Date.now()}`,
      tipo,
      ordem: blocos.length,
      config: { ...definicao.configPadrao }
    };

    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: [...blocos, novoBloco]
      }
    };

    setLocalLayout(novoLayout);
    setHasUnsavedChanges(true);
    setSelectedBlocoId(novoBloco.id);
  }, [layout, blocos, paginaAtual]);

  const removerBloco = useCallback((blocoId: string) => {
    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: blocos.filter(b => b.id !== blocoId).map((b, i) => ({ ...b, ordem: i }))
      }
    };

    setLocalLayout(novoLayout);
    setHasUnsavedChanges(true);
    if (selectedBlocoId === blocoId) {
      setSelectedBlocoId(null);
    }
  }, [layout, blocos, paginaAtual, selectedBlocoId]);

  const atualizarBlocoConfig = useCallback((blocoId: string, novaConfig: Record<string, any>) => {
    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: blocos.map(b => 
          b.id === blocoId ? { ...b, config: { ...b.config, ...novaConfig } } : b
        )
      }
    };

    setLocalLayout(novoLayout);
    setHasUnsavedChanges(true);
  }, [layout, blocos, paginaAtual]);

  const reordenarBlocos = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    const oldIndex = blocos.findIndex(b => b.id === activeId);
    const newIndex = blocos.findIndex(b => b.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const novoBlocos = [...blocos];
    const [removed] = novoBlocos.splice(oldIndex, 1);
    novoBlocos.splice(newIndex, 0, removed);

    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: novoBlocos.map((b, i) => ({ ...b, ordem: i }))
      }
    };

    setLocalLayout(novoLayout);
    setHasUnsavedChanges(true);
  }, [layout, blocos, paginaAtual]);

  const selectedBloco = blocos.find(b => b.id === selectedBlocoId);

  return {
    layout,
    blocos,
    lojaData,
    anuncios,
    lojaSlug: lojaData?.slug || '',
    isLoading: isLoadingConfig,
    isSaving: saveMutation.isPending,
    hasUnsavedChanges,
    selectedBloco,
    selectedBlocoId,
    setSelectedBlocoId,
    paginaAtual,
    setPaginaAtual,
    paginasDisponiveis: PAGINAS_DISPONIVEIS,
    adicionarBloco,
    removerBloco,
    atualizarBlocoConfig,
    reordenarBlocos,
    salvarLayout
  };
}
