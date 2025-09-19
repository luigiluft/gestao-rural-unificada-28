import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Truck, Package, MapPin, Plus, Route, Clock, Users } from 'lucide-react';

const Planejamento = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planejamento de Rotas</h1>
          <p className="text-muted-foreground">
            Planeje e otimize rotas de entrega e coleta
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Rota
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotas Ativas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Para hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Agendadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Taxa média</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Otimização de Rotas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Route className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Algoritmo Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema de otimização automática para reduzir tempo e combustível
                </p>
              </div>
              <Button variant="outline">Configurar</Button>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Janelas de Tempo</h4>
                <p className="text-sm text-muted-foreground">
                  Define horários específicos para cada entrega
                </p>
              </div>
              <Button variant="outline">Gerenciar</Button>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Equipes e Veículos</h4>
                <p className="text-sm text-muted-foreground">
                  Aloca recursos disponíveis de forma eficiente
                </p>
              </div>
              <Button variant="outline">Ver Recursos</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Rotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Rota SP-RJ</h4>
                  <p className="text-sm text-muted-foreground">12 entregas • 8h estimado</p>
                </div>
                <Badge variant="secondary">Planejada</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Rota BH-Salvador</h4>
                  <p className="text-sm text-muted-foreground">8 entregas • 6h estimado</p>
                </div>
                <Badge variant="default">Em Andamento</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Rota SP-Campinas</h4>
                  <p className="text-sm text-muted-foreground">15 entregas • 4h estimado</p>
                </div>
                <Badge variant="outline">Concluída</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Mapa de Planejamento</h3>
            <p className="text-muted-foreground">
              Visualização interativa do mapa para planejamento de rotas será implementada em breve.
              <br />
              Aqui você poderá visualizar todas as entregas no mapa e otimizar rotas em tempo real.
            </p>
            <Button variant="outline">
              Ver em Tela Cheia
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Planejamento;