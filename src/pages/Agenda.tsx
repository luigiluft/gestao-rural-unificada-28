import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, User, Package, Truck, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { useAgendaData, useAgendaStats } from '@/hooks/useAgendaData';
import { useGanttData, useGanttStats } from '@/hooks/useGanttData';
import { GanttChart } from '@/components/Agenda/GanttChart';
import { format } from 'date-fns';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [divergenciaFilter, setDivergenciaFilter] = useState('all');

  // Get agenda data from saidas and viagens
  const { data: agendaItems = [], isLoading } = useAgendaData(selectedDate);
  const { data: stats } = useAgendaStats();
  const { data: ganttItems = [], isLoading: ganttLoading } = useGanttData(selectedDate);
  const { data: ganttStats } = useGanttStats();

  const statusBadges = {
    expedido: { label: 'Expedido', variant: 'default' as const },
    entregue: { label: 'Entregue', variant: 'outline' as const },
    separacao_pendente: { label: 'Separação Pendente', variant: 'secondary' as const },
    em_separacao: { label: 'Em Separação', variant: 'secondary' as const }
  };

  const divergenciaBadges = {
    ok: { label: 'No Prazo', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    pequena: { label: 'Divergência Pequena', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
    grande: { label: 'Divergência Grande', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    sem_planejamento: { label: 'Sem Planejamento', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
  };

  const filteredAgendaItems = agendaItems.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status_saida === statusFilter;
    const matchesDivergencia = divergenciaFilter === 'all' || item.tipo_divergencia === divergenciaFilter;
    
    return matchesStatus && matchesDivergencia;
  });

  const dailyStats = agendaItems;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agenda de Entregas</h1>
          <p className="text-muted-foreground">
            Compare datas ideais vs planejadas das entregas
          </p>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.total_saidas}</div>
              <div className="text-sm text-muted-foreground">Total de Saídas</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.no_prazo}</div>
              <div className="text-sm text-muted-foreground">No Prazo</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.atrasadas}</div>
              <div className="text-sm text-muted-foreground">Atrasadas</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.sem_viagem}</div>
              <div className="text-sm text-muted-foreground">Sem Planejamento</div>
            </Card>
          </div>
        )}
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
                      <span>No Prazo:</span>
                      <span className="font-medium text-green-600">
                        {dailyStats.filter(a => a.tipo_divergencia === 'ok').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Divergências:</span>
                      <span className="font-medium text-yellow-600">
                        {dailyStats.filter(a => ['pequena', 'grande'].includes(a.tipo_divergencia)).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sem Planejamento:</span>
                      <span className="font-medium text-gray-600">
                        {dailyStats.filter(a => a.tipo_divergencia === 'sem_planejamento').length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="calendario" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendario">Calendário</TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="lista">Lista</TabsTrigger>
            </TabsList>

            <TabsContent value="calendario">
              <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Entregas - {selectedDate?.toLocaleDateString('pt-BR')}
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={divergenciaFilter} onValueChange={setDivergenciaFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Divergências</SelectItem>
                      <SelectItem value="ok">No Prazo</SelectItem>
                      <SelectItem value="pequena">Pequena Divergência</SelectItem>
                      <SelectItem value="grande">Grande Divergência</SelectItem>
                      <SelectItem value="sem_planejamento">Sem Planejamento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="expedido">Expedido</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="separacao_pendente">Separação Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredAgendaItems.length === 0 ? (
                <EmptyState
                  title="Nenhuma entrega encontrada"
                  description="Não há entregas para a data selecionada com os filtros aplicados."
                />
              ) : (
                <div className="space-y-4">
                  {filteredAgendaItems.map((item) => (
                    <Card key={item.saida_id} className={`border-l-4 ${
                      item.tipo_divergencia === 'ok' ? 'border-l-green-500' :
                      item.tipo_divergencia === 'pequena' ? 'border-l-yellow-500' :
                      item.tipo_divergencia === 'grande' ? 'border-l-red-500' :
                      'border-l-gray-400'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2">
                            <Badge variant={statusBadges[item.status_saida as keyof typeof statusBadges]?.variant || 'outline'}>
                              {statusBadges[item.status_saida as keyof typeof statusBadges]?.label || item.status_saida}
                            </Badge>
                            <Badge className={divergenciaBadges[item.tipo_divergencia].color}>
                              {divergenciaBadges[item.tipo_divergencia].label}
                            </Badge>
                            {item.viagem_id && (
                              <Badge variant="outline">
                                <Truck className="h-3 w-3 mr-1" />
                                Viagem: {item.viagem_id.slice(-6)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">
                              Data Ideal: {new Date(item.data_ideal).toLocaleDateString('pt-BR')}
                            </div>
                            {item.data_planejada && (
                              <div className="text-muted-foreground">
                                Planejada: {new Date(item.data_planejada).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            {item.divergencia_dias !== undefined && item.divergencia_dias !== 0 && (
                              <div className={`text-sm ${item.divergencia_dias > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {Math.abs(item.divergencia_dias)} dia(s) {item.divergencia_dias > 0 ? 'atrasada' : 'adiantada'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{item.cliente_nome}</span>
                          </div>
                          {item.cliente_telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{item.cliente_telefone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{item.endereco}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{item.produto_descricao}</span>
                          </div>
                          {item.janela_horario && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>Janela: {item.janela_horario}</span>
                            </div>
                          )}
                          {item.valor_total && (
                            <div className="text-sm font-medium text-green-600">
                              Valor: R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="gantt" className="space-y-4">
              {/* Gantt Stats */}
              {ganttStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ganttStats.total_saidas}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Com Viagem</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{ganttStats.saidas_com_viagem}</div>
                      <p className="text-xs text-muted-foreground">
                        {ganttStats.saidas_sem_viagem} sem viagem
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">No Prazo</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{ganttStats.no_prazo}</div>
                      <p className="text-xs text-muted-foreground">
                        {ganttStats.percentual_no_prazo}% do total
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Divergências</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{ganttStats.atrasadas}</div>
                      <p className="text-xs text-muted-foreground">
                        {ganttStats.antecipadas} antecipadas
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gantt Chart */}
              <GanttChart data={ganttItems} selectedDate={selectedDate} />
            </TabsContent>

            <TabsContent value="lista">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      Lista de Entregas - {selectedDate?.toLocaleDateString('pt-BR')}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Select value={divergenciaFilter} onValueChange={setDivergenciaFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Divergências</SelectItem>
                          <SelectItem value="ok">No Prazo</SelectItem>
                          <SelectItem value="pequena">Pequena Divergência</SelectItem>
                          <SelectItem value="grande">Grande Divergência</SelectItem>
                          <SelectItem value="sem_planejamento">Sem Planejamento</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Status</SelectItem>
                          <SelectItem value="expedido">Expedido</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                          <SelectItem value="separacao_pendente">Separação Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredAgendaItems.length === 0 ? (
                    <EmptyState
                      title="Nenhuma entrega encontrada"
                      description="Não há entregas para a data selecionada com os filtros aplicados."
                    />
                  ) : (
                    <div className="space-y-4">
                      {filteredAgendaItems.map((item) => (
                        <Card key={item.saida_id} className={`border-l-4 ${
                          item.tipo_divergencia === 'ok' ? 'border-l-green-500' :
                          item.tipo_divergencia === 'pequena' ? 'border-l-yellow-500' :
                          item.tipo_divergencia === 'grande' ? 'border-l-red-500' :
                          'border-l-gray-400'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-2">
                                <Badge variant={statusBadges[item.status_saida as keyof typeof statusBadges]?.variant || 'outline'}>
                                  {statusBadges[item.status_saida as keyof typeof statusBadges]?.label || item.status_saida}
                                </Badge>
                                <Badge className={divergenciaBadges[item.tipo_divergencia].color}>
                                  {divergenciaBadges[item.tipo_divergencia].label}
                                </Badge>
                                {item.viagem_id && (
                                  <Badge variant="outline">
                                    <Truck className="h-3 w-3 mr-1" />
                                    Viagem: {item.viagem_id.slice(-6)}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-medium">
                                  Data Ideal: {new Date(item.data_ideal).toLocaleDateString('pt-BR')}
                                </div>
                                {item.data_planejada && (
                                  <div className="text-muted-foreground">
                                    Planejada: {new Date(item.data_planejada).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                                {item.divergencia_dias !== undefined && item.divergencia_dias !== 0 && (
                                  <div className={`text-sm ${item.divergencia_dias > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    {Math.abs(item.divergencia_dias)} dia(s) {item.divergencia_dias > 0 ? 'atrasada' : 'adiantada'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{item.cliente_nome}</span>
                              </div>
                              {item.cliente_telefone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{item.cliente_telefone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{item.endereco}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                <span>{item.produto_descricao}</span>
                              </div>
                              {item.janela_horario && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>Janela: {item.janela_horario}</span>
                                </div>
                              )}
                              {item.valor_total && (
                                <div className="text-sm font-medium text-green-600">
                                  Valor: R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Agenda;