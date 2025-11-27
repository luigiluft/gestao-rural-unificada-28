import { useState } from "react";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSaidas } from "@/hooks/useSaidas";
import { useProducerSaidas } from "@/hooks/useProducerSaidas";
import { useUserRole } from "@/hooks/useUserRole";
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter";
import { format } from "date-fns";
import { exportToCSV } from "@/utils/csvExport";

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'rascunho': { label: 'Rascunho', variant: 'secondary' as const },
    'pendente_aprovacao': { label: 'Pendente Aprovação', variant: 'outline' as const },
    'aprovado': { label: 'Aprovado', variant: 'default' as const },
    'em_separacao': { label: 'Em Separação', variant: 'default' as const },
    'separado': { label: 'Separado', variant: 'default' as const },
    'em_carregamento': { label: 'Em Carregamento', variant: 'default' as const },
    'expedido': { label: 'Expedido', variant: 'default' as const },
    'em_transito': { label: 'Em Trânsito', variant: 'default' as const },
    'entregue': { label: 'Entregue', variant: 'default' as const },
    'cancelado': { label: 'Cancelado', variant: 'destructive' as const },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status || 'Desconhecido',
    variant: 'secondary' as const
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function NFeSaidas() {
  const { isCliente } = useUserRole();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedSaida, setSelectedSaida] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: saidasOperador, isLoading: isLoadingOperador } = useSaidas(
    dateRange?.from && dateRange?.to ? dateRange : undefined
  );
  const { data: saidasCliente, isLoading: isLoadingCliente } = useProducerSaidas();

  const saidas = isCliente ? saidasCliente : saidasOperador;
  const isLoading = isCliente ? isLoadingCliente : isLoadingOperador;

  const handleExport = () => {
    if (!saidas?.length) return;

    const columns = [
      { key: 'data_saida', label: 'Data Saída', visible: true },
      { key: 'codigo', label: 'Código', visible: true },
      { key: 'cliente_nome', label: 'Cliente', visible: true },
      { key: 'destino_nome', label: 'Destino', visible: true },
      { key: 'status', label: 'Status', visible: true },
      { key: 'valor_total', label: 'Valor Total', visible: true },
      { key: 'transportadora_nome', label: 'Transportadora', visible: true },
      { key: 'observacoes', label: 'Observações', visible: true }
    ];

    const formattedData = saidas.map(saida => ({
      ...saida,
      cliente_nome: saida.cliente?.razao_social || saida.cliente_nome,
      destino_nome: saida.local_entrega?.nome || saida.destino_nome
    }));

    exportToCSV({ 
      data: formattedData, 
      columns, 
      filename: `nfe-saidas-${format(new Date(), 'dd-MM-yyyy')}.csv` 
    });
  };

  const handleViewDetails = (saida: any) => {
    setSelectedSaida(saida);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>NF-e Saídas</CardTitle>
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
          <CardTitle>NF-e Saídas</CardTitle>
          <div className="flex items-center gap-2">
            <DateRangeFilter dateRange={dateRange || { from: undefined, to: undefined }} onDateRangeChange={setDateRange} />
            <Button onClick={handleExport} variant="outline" size="sm" disabled={!saidas?.length}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!saidas?.length ? (
            <EmptyState
              title="Nenhuma NF-e de saída encontrada"
              description="Não há notas fiscais de saída registradas no período selecionado."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saidas.map((saida) => (
                    <TableRow key={saida.id}>
                      <TableCell>{format(new Date(saida.data_saida), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{saida.codigo}</TableCell>
                      <TableCell>{saida.cliente?.razao_social || saida.cliente_nome}</TableCell>
                      <TableCell>{saida.local_entrega?.nome || saida.destino_nome}</TableCell>
                      <TableCell>{saida.transportadora_nome}</TableCell>
                      <TableCell>
                        {saida.valor_total?.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={saida.status || 'rascunho'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(saida)}
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
            <DialogTitle>Detalhes da NF-e de Saída</DialogTitle>
          </DialogHeader>
          {selectedSaida && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código</p>
                  <p className="text-sm">{selectedSaida.codigo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Saída</p>
                  <p className="text-sm">{format(new Date(selectedSaida.data_saida), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-sm">{selectedSaida.cliente?.razao_social || selectedSaida.cliente_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Local de Entrega</p>
                  <p className="text-sm">{selectedSaida.local_entrega?.nome || selectedSaida.destino_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transportadora</p>
                  <p className="text-sm">{selectedSaida.transportadora_nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-sm">
                    {selectedSaida.valor_total?.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedSaida.status || 'rascunho'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Previsão</p>
                  <p className="text-sm">
                    {selectedSaida.data_previsao_entrega 
                      ? format(new Date(selectedSaida.data_previsao_entrega), 'dd/MM/yyyy')
                      : '-'
                    }
                  </p>
                </div>
              </div>
              {selectedSaida.observacoes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedSaida.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
