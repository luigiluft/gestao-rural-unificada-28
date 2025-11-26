import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEntradas } from "@/hooks/useEntradas";
import { useProducerEntradas } from "@/hooks/useProducerEntradas";
import { useUserRole } from "@/hooks/useUserRole";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { format } from "date-fns";
import { exportToCSV } from "@/utils/csvExport";

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const },
    'em_transferencia': { label: 'Em Transferência', variant: 'default' as const },
    'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const },
    'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const },
    'confirmado': { label: 'Confirmado', variant: 'default' as const },
    'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Desconhecido',
    variant: 'secondary' as const
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function NotaDeposito() {
  const { isCliente } = useUserRole();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: entradasOperador, isLoading: isLoadingOperador } = useEntradas({
    enabled: !isCliente,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const { data: entradasCliente, isLoading: isLoadingCliente } = useProducerEntradas({
    enabled: isCliente,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });

  const entradas = isCliente ? entradasCliente : entradasOperador;
  const isLoading = isCliente ? isLoadingCliente : isLoadingOperador;

  // Filtrar apenas notas de depósito
  const entradasFiltradas = entradas?.filter(e => 
    e.natureza_operacao?.toLowerCase().includes('nota') && 
    e.natureza_operacao?.toLowerCase().includes('depósito')
  ) || [];

  const handleExport = () => {
    if (!entradasFiltradas?.length) return;
    
    const csvData = entradasFiltradas.map(entrada => ({
      'Número NF': entrada.numero_nfe || '',
      'Data Emissão': entrada.data_emissao ? format(new Date(entrada.data_emissao), 'dd/MM/yyyy') : '',
      'Emitente': entrada.emitente_nome || '',
      'CNPJ Emitente': entrada.emitente_cnpj || '',
      'Destinatário': entrada.destinatario_nome || '',
      'Valor Total': entrada.valor_total || 0,
      'Status': entrada.status_aprovacao || '',
      'Natureza Operação': entrada.natureza_operacao || '',
    }));
    
    exportToCSV(csvData, 'nota-deposito');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nota de Depósito</h1>
          <p className="text-muted-foreground mt-2">
            Notas fiscais de depósito de mercadorias
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={!entradasFiltradas?.length}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notas Fiscais</CardTitle>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : entradasFiltradas.length === 0 ? (
            <EmptyState
              title="Nenhuma nota de depósito encontrada"
              description="Não há notas fiscais de depósito no período selecionado."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número NF</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Emitente</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradasFiltradas.map((entrada) => (
                    <TableRow key={entrada.id}>
                      <TableCell className="font-medium">{entrada.numero_nfe}</TableCell>
                      <TableCell>
                        {entrada.data_emissao ? format(new Date(entrada.data_emissao), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>{entrada.emitente_nome}</TableCell>
                      <TableCell>{entrada.destinatario_nome}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(entrada.valor_total || 0)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entrada.status_aprovacao || ''} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEntrada(entrada);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
          </DialogHeader>
          {selectedEntrada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número NF</p>
                  <p className="text-sm">{selectedEntrada.numero_nfe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chave NF-e</p>
                  <p className="text-sm font-mono text-xs">{selectedEntrada.chave_nfe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Emissão</p>
                  <p className="text-sm">
                    {selectedEntrada.data_emissao ? format(new Date(selectedEntrada.data_emissao), 'dd/MM/yyyy HH:mm') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Natureza Operação</p>
                  <p className="text-sm">{selectedEntrada.natureza_operacao}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Emitente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-sm">{selectedEntrada.emitente_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                    <p className="text-sm">{selectedEntrada.emitente_cnpj}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Destinatário</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-sm">{selectedEntrada.destinatario_nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPF/CNPJ</p>
                    <p className="text-sm">{selectedEntrada.destinatario_cpf_cnpj}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Valores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Produtos</p>
                    <p className="text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedEntrada.valor_produtos || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedEntrada.valor_total || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
