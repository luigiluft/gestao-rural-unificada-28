import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Truck, User, Package, DollarSign, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useUpdateViagem } from '@/hooks/useUpdateViagem';
import { useViagemSaidasDetails } from '@/hooks/useViagemSaidas';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const viagemSchema = z.object({
  numero: z.string().min(1, 'Número da viagem é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
  motorista_id: z.string().optional(),
});

type ViagemFormData = z.infer<typeof viagemSchema>;

interface ViagemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viagem: any;
  onUpdate?: (viagem: any) => void;
}

const statusBadges = {
  planejada: { label: 'Planejada', variant: 'secondary' as const },
  em_andamento: { label: 'Em Andamento', variant: 'default' as const },
  finalizada: { label: 'Finalizada', variant: 'outline' as const },
  entregue: { label: 'Entregue', variant: 'outline' as const },
  cancelada: { label: 'Cancelada', variant: 'destructive' as const }
};

export const ViagemDetailsDialog = ({ 
  open, 
  onOpenChange, 
  viagem,
  onUpdate 
}: ViagemDetailsDialogProps) => {
  const { data: motoristas = [] } = useMotoristas();
  const { data: saidas = [], isLoading: isLoadingSaidas } = useViagemSaidasDetails(viagem?.id);

  const form = useForm<ViagemFormData>({
    resolver: zodResolver(viagemSchema),
    values: viagem ? {
      numero: viagem.numero || '',
      data_inicio: viagem.data_inicio ? viagem.data_inicio.slice(0, 10) : '',
      data_fim: viagem.data_fim ? viagem.data_fim.slice(0, 10) : '',
      observacoes: viagem.observacoes || '',
      motorista_id: viagem.motorista_id || '',
    } : undefined,
  });

  const updateViagem = useUpdateViagem();

  const onSubmit = (data: ViagemFormData) => {
    updateViagem.mutate({
      id: viagem.id,
      numero: data.numero,
      data_inicio: data.data_inicio || null,
      data_fim: data.data_fim || null,
      observacoes: data.observacoes || null,
      motorista_id: data.motorista_id || null,
    });
    if (onUpdate) {
      onUpdate({ ...viagem, ...data });
    }
    onOpenChange(false);
  };

  if (!viagem) return null;

  const statusConfig = statusBadges[viagem.status as keyof typeof statusBadges] || statusBadges.planejada;
  const motoristaAtual = motoristas.find(m => m.id === viagem.motorista_id);

  // Função para formatar endereço completo
  const formatarEndereco = (fazenda: any) => {
    if (!fazenda) return null;
    
    const partes = [];
    if (fazenda.tipo_logradouro && fazenda.nome_logradouro) {
      partes.push(`${fazenda.tipo_logradouro} ${fazenda.nome_logradouro}`);
      if (fazenda.numero) partes[0] += `, ${fazenda.numero}`;
    }
    if (fazenda.bairro) partes.push(fazenda.bairro);
    if (fazenda.municipio && fazenda.uf) partes.push(`${fazenda.municipio}/${fazenda.uf}`);
    if (fazenda.cep) partes.push(`CEP: ${fazenda.cep}`);
    
    return partes.join(' - ');
  };

  // Processar destinos únicos a partir de fazendas
  const destinos = saidas
    .filter((s: any) => s.fazenda || s.frete_destino)
    .map((s: any) => ({
      id: s.fazenda?.id || s.id,
      nome: s.fazenda?.nome || 'Destino',
      endereco: s.fazenda ? formatarEndereco(s.fazenda) : s.frete_destino || 'Endereço não informado'
    }))
    .filter((destino, index, self) => 
      index === self.findIndex(d => d.id === destino.id)
    );

  // Processar produtos
  const produtos = saidas.flatMap((saida: any) => 
    (saida.saida_itens || []).map((item: any) => ({
      produto_nome: item.produtos?.nome || 'Produto não identificado',
      produto_codigo: item.produtos?.codigo || '',
      quantidade: item.quantidade,
      lote: item.lote || 'Sem lote',
      destino: saida.fazenda?.nome || saida.frete_destino || 'Destino não informado',
      saida_id: saida.id
    }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Viagem {viagem.numero}
            <Badge variant={statusConfig.variant}>
              {statusConfig.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Estatísticas da Viagem */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remessas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.total_remessas || 0}</div>
              <div className="text-xs text-muted-foreground">
                {viagem.remessas_entregues || 0} entregues
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distância</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.distancia_total || 0} km</div>
              <div className="text-xs text-muted-foreground">
                {viagem.distancia_percorrida || 0} km percorridos
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peso</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viagem.peso_total || 0} kg</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Motorista</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {motoristaAtual ? motoristaAtual.nome : 'Não atribuído'}
              </div>
              {motoristaAtual && (
                <div className="text-xs text-muted-foreground">
                  {motoristaAtual.cpf}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Destinos da Viagem */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Destinos da Viagem</h3>
          </div>
          
          {isLoadingSaidas ? (
            <div className="text-sm text-muted-foreground">Carregando destinos...</div>
          ) : destinos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Nenhum destino vinculado a esta viagem
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {destinos.map((destino, idx) => (
                <Card key={destino.id || idx}>
                  <CardContent className="pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="font-semibold text-sm">{destino.nome}</div>
                      </div>
                      <div className="text-sm text-muted-foreground ml-6">{destino.endereco}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Produtos e Itens */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Produtos e Itens</h3>
          </div>
          
          {isLoadingSaidas ? (
            <div className="text-sm text-muted-foreground">Carregando produtos...</div>
          ) : produtos.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  Nenhum produto vinculado a esta viagem
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Destino</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((produto, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="font-medium">{produto.produto_nome}</div>
                            {produto.produto_codigo && (
                              <div className="text-xs text-muted-foreground">
                                Cód: {produto.produto_codigo}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {produto.quantidade}
                          </TableCell>
                          <TableCell className="text-sm">{produto.lote}</TableCell>
                          <TableCell className="text-sm">{produto.destino}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator className="my-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Viagem</FormLabel>
                    <FormControl>
                      <Input placeholder="V001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="motorista_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar motorista..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {motoristas.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{motorista.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  CPF: {motorista.cpf}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre a viagem..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informações Adicionais */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Informações da Viagem</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Data de Criação:</span>
                  <div className="text-muted-foreground">
                    {viagem.created_at ? format(new Date(viagem.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Última Atualização:</span>
                  <div className="text-muted-foreground">
                    {viagem.updated_at ? format(new Date(viagem.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Hodômetro Início:</span>
                  <div className="text-muted-foreground">
                    {viagem.hodometro_inicio ? `${viagem.hodometro_inicio} km` : 'Não definido'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Hodômetro Fim:</span>
                  <div className="text-muted-foreground">
                    {viagem.hodometro_fim ? `${viagem.hodometro_fim} km` : 'Não definido'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};