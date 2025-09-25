import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  FileText, 
  Camera, 
  Signature, 
  Plus,
  Eye,
  Download,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { useComprovantesEntrega } from '@/hooks/useComprovantesEntrega';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { DriverInvitationDialog } from '@/components/ProofOfDelivery/DriverInvitationDialog';
import { DeliveryAssignment } from '@/components/ProofOfDelivery/DeliveryAssignment';

const ProofOfDelivery = () => {
  return (

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proof of Delivery</h1>
          <p className="text-muted-foreground">
            Gerencie comprovantes de entrega e assinaturas digitais
          </p>
        </div>
        
        <div className="flex gap-2">
          <DriverInvitationDialog />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Comprovante
          </Button>
        </div>
      </div>

      {/* Sistema de Gerenciamento de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Gerenciamento de Entregas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie motoristas, atribuições e configure o sistema de proof of delivery
          </p>
        </CardHeader>
      </Card>

      {/* Atribuição de Motoristas */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuição de Motoristas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure atribuições automáticas para entregas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <DeliveryAssignment
            deliveryId="demo-1"
            deliveryCode="ENT-001"
            clientName="Cliente Demo"
            currentStatus="pendente"
          />
          <DeliveryAssignment
            deliveryId="demo-2"
            deliveryCode="ENT-002"
            clientName="Cliente Exemplo"
            currentStatus="confirmado"
          />
        </CardContent>
      </Card>

      {/* Detalhes Expandidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Signature className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Assinatura Digital</h4>
                <p className="text-sm text-muted-foreground">
                  Capture assinaturas digitais dos recebedores
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Camera className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Fotos de Entrega</h4>
                <p className="text-sm text-muted-foreground">
                  Documente entregas com fotos georreferenciadas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <MapPin className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">Geolocalização</h4>
                <p className="text-sm text-muted-foreground">
                  Registre a localização exata da entrega
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Relatório de Entregas Diário
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Exportar Comprovantes PDF
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <CheckCircle className="h-4 w-4 mr-2" />
              Relatório de Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProofOfDelivery;