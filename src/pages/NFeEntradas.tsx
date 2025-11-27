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

export default function NFeEntradas() {
  const { isCliente } = useUserRole();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: entradasOperador, isLoading: isLoadingOperador } = useEntradas(
    dateRange?.from && dateRange?.to ? dateRange : undefined
  );
  const { data: entradasCliente, isLoading: isLoadingCliente } = useProducerEntradas(
    dateRange?.from && dateRange?.to ? dateRange : undefined
  );

  const entradas = isCliente ? entradasCliente : entradasOperador;
  const isLoading = isCliente ? isLoadingCliente : isLoadingOperador;

  // Filtrar apenas NF-e de entrada
  const entradasFiltradas = entradas?.filter(e => 
    e.tipo_nf === '0' // 0 = Entrada
  ) || [];

  const handleExport = () => {
    if (!entradasFiltradas.length) return;

    const columns = [
      { key: 'data_entrada', label: 'Data Entrada', visible: true },
      { key: 'numero_nfe', label: 'Nota Fiscal', visible: true },
      { key: 'serie', label: 'Série', visible: true },
      { key: 'chave_nfe', label: 'Chave NF-e', visible: true },
      { key: 'emitente_nome', label: 'Emitente', visible: true },
      { key: 'emitente_cnpj', label: 'CNPJ Emitente', visible: true },
      { key: 'destinatario_nome', label: 'Destinatário', visible: true },
      { key: 'valor_total', label: 'Valor Total', visible: true },
      { key: 'status_aprovacao', label: 'Status', visible: true },
      { key: 'natureza_operacao', label: 'Natureza Operação', visible: true }
    ];

    exportToCSV({ 
      data: entradasFiltradas, 
      columns, 
      filename: `nfe-entradas-${format(new Date(), 'dd-MM-yyyy')}.csv` 
    });
  };

  const handleViewDetails = (entrada: any) => {
    setSelectedEntrada(entrada);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>NF-e Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>NF-e Entradas</CardTitle>
          <div className="flex items-center gap-2">
            <DateRangeFilter dateRange={dateRange || { from: undefined, to: undefined }} onDateRangeChange={setDateRange} />
            <Button onClick={handleExport} variant="outline" size="sm" disabled={!entradasFiltradas.length}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entradasFiltradas.length === 0 ? (
            <EmptyState
              title="Nenhuma NF-e de entrada encontrada"
              description="Não há notas fiscais de entrada registradas no período selecionado."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>NF-e</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Emitente</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradasFiltradas.map((entrada) => (
                    <TableRow key={entrada.id}>
                      <TableCell>{format(new Date(entrada.data_entrada), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{entrada.numero_nfe}</TableCell>
                      <TableCell>{entrada.serie}</TableCell>
                      <TableCell>{entrada.emitente_nome}</TableCell>
                      <TableCell>{entrada.destinatario_nome}</TableCell>
                      <TableCell>
                        {entrada.valor_total?.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entrada.status_aprovacao || 'pendente'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(entrada)}
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
            <DialogTitle>Detalhes da NF-e de Entrada</DialogTitle>
          </DialogHeader>
          {selectedEntrada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nota Fiscal</p>
                  <p className="text-sm">{selectedEntrada.numero_nfe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Série</p>
                  <p className="text-sm">{selectedEntrada.serie}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Entrada</p>
                  <p className="text-sm">{format(new Date(selectedEntrada.data_entrada), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chave NF-e</p>
                  <p className="text-sm break-all">{selectedEntrada.chave_nfe}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emitente</p>
                  <p className="text-sm">{selectedEntrada.emitente_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CNPJ Emitente</p>
                  <p className="text-sm">{selectedEntrada.emitente_cnpj}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destinatário</p>
                  <p className="text-sm">{selectedEntrada.destinatario_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-sm">
                    {selectedEntrada.valor_total?.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Natureza da Operação</p>
                  <p className="text-sm">{selectedEntrada.natureza_operacao}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedEntrada.status_aprovacao || 'pendente'} />
                </div>
              </div>
              {selectedEntrada.observacoes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedEntrada.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
