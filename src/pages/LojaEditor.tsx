import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ExternalLink, Save, Loader2 } from 'lucide-react';
import { useCliente } from '@/contexts/ClienteContext';
import { usePageBuilder } from '@/hooks/usePageBuilder';
import { PageBuilderSidebar } from '@/components/PageBuilder/PageBuilderSidebar';
import { PageBuilderCanvas } from '@/components/PageBuilder/PageBuilderCanvas';
import { PageBuilderSettings } from '@/components/PageBuilder/PageBuilderSettings';

export default function LojaEditor() {
  const navigate = useNavigate();
  const { selectedCliente } = useCliente();
  const {
    blocos,
    lojaData,
    anuncios,
    lojaSlug,
    isLoading,
    isSaving,
    selectedBloco,
    selectedBlocoId,
    setSelectedBlocoId,
    paginaAtual,
    setPaginaAtual,
    paginasDisponiveis,
    adicionarBloco,
    removerBloco,
    atualizarBlocoConfig,
    reordenarBlocos
  } = usePageBuilder();

  if (!selectedCliente) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Selecione uma empresa para editar a loja.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Editor da Loja</h1>
            <p className="text-sm text-muted-foreground">
              {lojaData?.nome_loja || selectedCliente.razao_social || selectedCliente.nome_fantasia}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Page Selector */}
          <Select value={paginaAtual} onValueChange={setPaginaAtual}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a página" />
            </SelectTrigger>
            <SelectContent>
              {paginasDisponiveis.map(pagina => (
                <SelectItem key={pagina.id} value={pagina.id}>
                  {pagina.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {lojaSlug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/loja/${lojaSlug}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Loja
            </Button>
          )}
          <Button disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvo'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <PageBuilderSidebar onAddBloco={adicionarBloco} />
          <PageBuilderCanvas
            blocos={blocos}
            selectedBlocoId={selectedBlocoId}
            onSelectBloco={setSelectedBlocoId}
            onRemoveBloco={removerBloco}
            onReorder={reordenarBlocos}
            lojaData={lojaData}
            anuncios={anuncios}
            lojaSlug={lojaSlug}
          />
          <PageBuilderSettings
            bloco={selectedBloco}
            onUpdateConfig={(config) => {
              if (selectedBlocoId) {
                atualizarBlocoConfig(selectedBlocoId, config);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
