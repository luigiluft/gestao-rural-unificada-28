import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, User, Package, Plus } from 'lucide-react';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  // Mock data para agendamentos
  const agendamentos = [
    {
      id: '1',
      tipo: 'entrega',
      cliente: 'João Silva',
      telefone: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123 - São Paulo, SP',
      data: '2024-01-15',
      horario: '09:00',
      status: 'confirmado',
      produto: 'Fertilizante NPK - 50kg',
      observacoes: 'Portão azul, tocar campainha'
    },
    {
      id: '2',
      tipo: 'coleta',
      cliente: 'Maria Santos',
      telefone: '(11) 88888-8888',
      endereco: 'Av. Principal, 456 - São Paulo, SP',
      data: '2024-01-15',
      horario: '14:30',
      status: 'pendente',
      produto: 'Sementes de Soja - 25 sacos',
      observacoes: 'Agendar com antecedência'
    },
    {
      id: '3',
      tipo: 'entrega',
      cliente: 'Carlos Oliveira',
      telefone: '(11) 77777-7777',
      endereco: 'Rua do Campo, 789 - São Paulo, SP',
      data: '2024-01-15',
      horario: '16:00',
      status: 'concluido',
      produto: 'Defensivo Agrícola - 10L',
      observacoes: 'Entrega realizada com sucesso'
    }
  ];

  const statusBadges = {
    pendente: { label: 'Pendente', variant: 'secondary' as const },
    confirmado: { label: 'Confirmado', variant: 'default' as const },
    concluido: { label: 'Concluído', variant: 'outline' as const },
    cancelado: { label: 'Cancelado', variant: 'destructive' as const }
  };

  const tipoBadges = {
    entrega: { label: 'Entrega', variant: 'default' as const },
    coleta: { label: 'Coleta', variant: 'secondary' as const }
  };

  const filteredAgendamentos = agendamentos.filter(agendamento => {
    const agendamentoDate = new Date(agendamento.data);
    const isSameDate = selectedDate && 
      agendamentoDate.toDateString() === selectedDate.toDateString();
    
    const matchesStatus = statusFilter === 'all' || agendamento.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || agendamento.tipo === tipoFilter;
    
    return isSameDate && matchesStatus && matchesTipo;
  });

  const getAgendamentosForDate = (date: Date) => {
    return agendamentos.filter(agendamento => {
      const agendamentoDate = new Date(agendamento.data);
      return agendamentoDate.toDateString() === date.toDateString();
    });
  };

  const dailyStats = selectedDate ? getAgendamentosForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie agendamentos de entregas e coletas
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="coleta">Coleta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input id="cliente" placeholder="Nome do cliente" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input id="data" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario">Horário</Label>
                  <Input id="horario" type="time" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" placeholder="Endereço completo" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(XX) XXXXX-XXXX" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <Input id="produto" placeholder="Descrição do produto" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Observações adicionais" />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Agendamento</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              
              {/* Estatísticas do Dia */}
              {selectedDate && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">
                    {selectedDate.toLocaleDateString('pt-BR')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{dailyStats.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entregas:</span>
                      <span className="font-medium">
                        {dailyStats.filter(a => a.tipo === 'entrega').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coletas:</span>
                      <span className="font-medium">
                        {dailyStats.filter(a => a.tipo === 'coleta').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmados:</span>
                      <span className="font-medium">
                        {dailyStats.filter(a => a.status === 'confirmado').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Agendamentos - {selectedDate?.toLocaleDateString('pt-BR')}
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="coleta">Coleta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAgendamentos.length === 0 ? (
                <EmptyState
                  title="Nenhum agendamento encontrado"
                  description="Não há agendamentos para a data selecionada com os filtros aplicados."
                />
              ) : (
                <div className="space-y-4">
                  {filteredAgendamentos.map((agendamento) => (
                    <Card key={agendamento.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2">
                            <Badge variant={tipoBadges[agendamento.tipo as keyof typeof tipoBadges].variant}>
                              {tipoBadges[agendamento.tipo as keyof typeof tipoBadges].label}
                            </Badge>
                            <Badge variant={statusBadges[agendamento.status as keyof typeof statusBadges].variant}>
                              {statusBadges[agendamento.status as keyof typeof statusBadges].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {agendamento.horario}
                          </div>
                        </div>
                        
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{agendamento.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{agendamento.telefone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{agendamento.endereco}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{agendamento.produto}</span>
                          </div>
                          {agendamento.observacoes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Obs:</strong> {agendamento.observacoes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          {agendamento.status === 'pendente' && (
                            <Button size="sm">
                              Confirmar
                            </Button>
                          )}
                          {agendamento.status === 'confirmado' && (
                            <Button size="sm">
                              Concluir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Agenda;