import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useViagens } from '@/hooks/useViagens';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ViagemKanbanBoard } from '@/components/Viagens/ViagemKanbanBoard';
import { ViagemDetailsDialog } from '@/components/Viagens/ViagemDetailsDialog';
const Viagens = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedViagem, setSelectedViagem] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const {
    data: viagens = [],
    isLoading,
    error
  } = useViagens();
  const statusBadges = {
    planejada: {
      label: 'Planejada',
      variant: 'secondary' as const
    },
    em_andamento: {
      label: 'Em Andamento',
      variant: 'default' as const
    },
    entregue: {
      label: 'Entregue',
      variant: 'outline' as const
    },
    cancelada: {
      label: 'Cancelada',
      variant: 'destructive' as const
    }
  };
  const filteredViagens = viagens.filter(viagem => {
    const matchesSearch = viagem.numero?.toLowerCase().includes(searchTerm.toLowerCase()) || viagem.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || viagem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const calcularProgresso = (viagem: any) => {
    if (viagem.status === 'entregue') return 100;
    if (viagem.status === 'em_andamento') return 50;
    if (viagem.status === 'planejada') return 10;
    return 0;
  };
  const handleViagemClick = (viagem: any) => {
    setSelectedViagem(viagem);
    setDetailsDialogOpen(true);
  };
  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <div>Erro ao carregar viagens: {error.message}</div>;
  }
  return <div className="space-y-6 h-full w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold">Planejamento</h1>
        <p className="text-muted-foreground">
          Planeje e acompanhe as viagens dos veículos da frota
        </p>
      </div>

      {/* Filtros */}
      

      {/* Kanban Board */}
      <ViagemKanbanBoard viagens={filteredViagens} onViagemSelect={handleViagemClick} />

      {/* Dialog de Detalhes da Viagem */}
      <ViagemDetailsDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen} viagem={selectedViagem} onUpdate={() => {
      // Dados serão atualizados via React Query
    }} />
    </div>;
};
export default Viagens;