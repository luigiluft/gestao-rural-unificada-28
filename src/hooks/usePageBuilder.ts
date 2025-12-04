import { useState, useCallback } from 'react';
import { useCliente } from '@/contexts/ClienteContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BlocoLoja, LayoutPaginas, BLOCOS_DISPONIVEIS } from '@/components/PageBuilder/types';
import type { Json } from '@/integrations/supabase/types';

const DEFAULT_LAYOUT: LayoutPaginas = {
  home: {
    blocos: [
      { id: 'hero-1', tipo: 'hero', ordem: 0, config: BLOCOS_DISPONIVEIS.find(b => b.tipo === 'hero')?.configPadrao || {} },
      { id: 'produtos-1', tipo: 'grade_produtos', ordem: 1, config: BLOCOS_DISPONIVEIS.find(b => b.tipo === 'grade_produtos')?.configPadrao || {} },
      { id: 'contato-1', tipo: 'contato', ordem: 2, config: BLOCOS_DISPONIVEIS.find(b => b.tipo === 'contato')?.configPadrao || {} }
    ]
  }
};

export function usePageBuilder() {
  const { selectedCliente } = useCliente();
  const queryClient = useQueryClient();
  const [selectedBlocoId, setSelectedBlocoId] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState<string>('home');

  const { data: layout, isLoading } = useQuery({
    queryKey: ['page-builder-layout', selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente?.id) return DEFAULT_LAYOUT;
      
      const { data, error } = await supabase
        .from('loja_configuracao')
        .select('layout_paginas')
        .eq('cliente_id', selectedCliente.id)
        .maybeSingle();

      if (error) throw error;
      if (!data?.layout_paginas) return DEFAULT_LAYOUT;
      return data.layout_paginas as unknown as LayoutPaginas;
    },
    enabled: !!selectedCliente?.id
  });

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
      queryClient.invalidateQueries({ queryKey: ['page-builder-layout', selectedCliente?.id] });
      toast.success('Layout salvo com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar layout');
    }
  });

  const blocos = layout?.[paginaAtual]?.blocos || [];

  const adicionarBloco = useCallback((tipo: BlocoLoja['tipo']) => {
    const definicao = BLOCOS_DISPONIVEIS.find(b => b.tipo === tipo);
    if (!definicao || !layout) return;

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

    saveMutation.mutate(novoLayout);
    setSelectedBlocoId(novoBloco.id);
  }, [layout, blocos, paginaAtual, saveMutation]);

  const removerBloco = useCallback((blocoId: string) => {
    if (!layout) return;

    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: blocos.filter(b => b.id !== blocoId).map((b, i) => ({ ...b, ordem: i }))
      }
    };

    saveMutation.mutate(novoLayout);
    if (selectedBlocoId === blocoId) {
      setSelectedBlocoId(null);
    }
  }, [layout, blocos, paginaAtual, selectedBlocoId, saveMutation]);

  const atualizarBlocoConfig = useCallback((blocoId: string, novaConfig: Record<string, any>) => {
    if (!layout) return;

    const novoLayout: LayoutPaginas = {
      ...layout,
      [paginaAtual]: {
        blocos: blocos.map(b => 
          b.id === blocoId ? { ...b, config: { ...b.config, ...novaConfig } } : b
        )
      }
    };

    saveMutation.mutate(novoLayout);
  }, [layout, blocos, paginaAtual, saveMutation]);

  const reordenarBlocos = useCallback((activeId: string, overId: string) => {
    if (!layout || activeId === overId) return;

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

    saveMutation.mutate(novoLayout);
  }, [layout, blocos, paginaAtual, saveMutation]);

  const selectedBloco = blocos.find(b => b.id === selectedBlocoId);

  return {
    layout,
    blocos,
    isLoading,
    isSaving: saveMutation.isPending,
    selectedBloco,
    selectedBlocoId,
    setSelectedBlocoId,
    paginaAtual,
    setPaginaAtual,
    adicionarBloco,
    removerBloco,
    atualizarBlocoConfig,
    reordenarBlocos
  };
}
