import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlocoLoja, BLOCOS_DISPONIVEIS } from './types';

interface PageBuilderSettingsProps {
  bloco: BlocoLoja | undefined;
  onUpdateConfig: (blocoId: string, config: Record<string, any>) => void;
}

export function PageBuilderSettings({ bloco, onUpdateConfig }: PageBuilderSettingsProps) {
  if (!bloco) {
    return (
      <div className="w-80 border-l bg-muted/30 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center p-4">
          Selecione um bloco para editar suas configurações
        </p>
      </div>
    );
  }

  const definicao = BLOCOS_DISPONIVEIS.find(b => b.tipo === bloco.tipo);

  const handleChange = (key: string, value: any) => {
    onUpdateConfig(bloco.id, { [key]: value });
  };

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-xl">{definicao?.icone}</span>
          <div>
            <h3 className="font-semibold text-sm">{definicao?.nome}</h3>
            <p className="text-xs text-muted-foreground">Configurações do bloco</p>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {bloco.tipo === 'hero' && (
            <>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={bloco.config.titulo || ''}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Título do banner"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={bloco.config.subtitulo || ''}
                  onChange={(e) => handleChange('subtitulo', e.target.value)}
                  placeholder="Subtítulo"
                />
              </div>
              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input
                  value={bloco.config.textoBotao || ''}
                  onChange={(e) => handleChange('textoBotao', e.target.value)}
                  placeholder="Ver Produtos"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor de Fundo</Label>
                <Input
                  type="color"
                  value={bloco.config.corFundo || '#22c55e'}
                  onChange={(e) => handleChange('corFundo', e.target.value)}
                />
              </div>
            </>
          )}

          {bloco.tipo === 'grade_produtos' && (
            <>
              <div className="space-y-2">
                <Label>Título da Seção</Label>
                <Input
                  value={bloco.config.titulo || ''}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Nossos Produtos"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Produtos</Label>
                <Select
                  value={String(bloco.config.quantidade || 8)}
                  onValueChange={(v) => handleChange('quantidade', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 produtos</SelectItem>
                    <SelectItem value="8">8 produtos</SelectItem>
                    <SelectItem value="12">12 produtos</SelectItem>
                    <SelectItem value="16">16 produtos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Mostrar Preço</Label>
                <Switch
                  checked={bloco.config.mostrarPreco !== false}
                  onCheckedChange={(v) => handleChange('mostrarPreco', v)}
                />
              </div>
            </>
          )}

          {bloco.tipo === 'texto' && (
            <>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={bloco.config.titulo || ''}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Título (opcional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  value={bloco.config.conteudo || ''}
                  onChange={(e) => handleChange('conteudo', e.target.value)}
                  placeholder="Digite o texto..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Alinhamento</Label>
                <Select
                  value={bloco.config.alinhamento || 'left'}
                  onValueChange={(v) => handleChange('alinhamento', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {bloco.tipo === 'contato' && (
            <>
              <div className="flex items-center justify-between">
                <Label>Mostrar WhatsApp</Label>
                <Switch
                  checked={bloco.config.mostrarWhatsapp !== false}
                  onCheckedChange={(v) => handleChange('mostrarWhatsapp', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Mostrar Email</Label>
                <Switch
                  checked={bloco.config.mostrarEmail !== false}
                  onCheckedChange={(v) => handleChange('mostrarEmail', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Mostrar Endereço</Label>
                <Switch
                  checked={bloco.config.mostrarEndereco === true}
                  onCheckedChange={(v) => handleChange('mostrarEndereco', v)}
                />
              </div>
            </>
          )}

          {bloco.tipo === 'video' && (
            <>
              <div className="space-y-2">
                <Label>URL do Vídeo</Label>
                <Input
                  value={bloco.config.url || ''}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={bloco.config.titulo || ''}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Título do vídeo"
                />
              </div>
            </>
          )}

          {bloco.tipo === 'separador' && (
            <>
              <div className="space-y-2">
                <Label>Estilo</Label>
                <Select
                  value={bloco.config.estilo || 'linha'}
                  onValueChange={(v) => handleChange('estilo', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linha">Linha</SelectItem>
                    <SelectItem value="pontilhado">Pontilhado</SelectItem>
                    <SelectItem value="espaco">Espaço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Margem</Label>
                <Select
                  value={bloco.config.margem || 'normal'}
                  onValueChange={(v) => handleChange('margem', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pequena">Pequena</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {bloco.tipo === 'redes_sociais' && (
            <>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={bloco.config.instagram || ''}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="@seuinstagram"
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={bloco.config.facebook || ''}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  placeholder="URL do Facebook"
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  value={bloco.config.youtube || ''}
                  onChange={(e) => handleChange('youtube', e.target.value)}
                  placeholder="URL do YouTube"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={bloco.config.linkedin || ''}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  placeholder="URL do LinkedIn"
                />
              </div>
            </>
          )}

          {bloco.tipo === 'depoimentos' && (
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={bloco.config.titulo || ''}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="O que nossos clientes dizem"
              />
              <p className="text-xs text-muted-foreground">
                Os depoimentos podem ser gerenciados em uma seção dedicada futuramente.
              </p>
            </div>
          )}

          {bloco.tipo === 'categorias' && (
            <div className="space-y-2">
              <Label>Título da Seção</Label>
              <Input
                value={bloco.config.titulo || ''}
                onChange={(e) => handleChange('titulo', e.target.value)}
                placeholder="Categorias"
              />
              <p className="text-xs text-muted-foreground">
                As categorias são exibidas automaticamente com base nos produtos.
              </p>
            </div>
          )}

          {bloco.tipo === 'carrossel' && (
            <>
              <div className="flex items-center justify-between">
                <Label>Autoplay</Label>
                <Switch
                  checked={bloco.config.autoplay !== false}
                  onCheckedChange={(v) => handleChange('autoplay', v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Intervalo (ms)</Label>
                <Input
                  type="number"
                  value={bloco.config.intervalo || 5000}
                  onChange={(e) => handleChange('intervalo', parseInt(e.target.value))}
                  min={1000}
                  step={500}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                As imagens do carrossel podem ser gerenciadas em uma seção dedicada futuramente.
              </p>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
