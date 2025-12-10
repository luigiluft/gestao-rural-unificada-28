import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Building, Info, Home } from "lucide-react";
import { FranquiaFormData } from "../FranquiaWizard";
import { useUserRole } from "@/hooks/useUserRole";

interface BasicInfoStepProps {
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
  franqueadosMasters: any[];
}

export function BasicInfoStep({ formData, setFormData, franqueadosMasters }: BasicInfoStepProps) {
  const { isCliente, isAdmin, isOperador } = useUserRole();

  // Para clientes: Matriz e Filial
  // Para admin/operador: Franquia e Filial
  const isClienteMode = isCliente;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
      </div>
      
      <div className="space-y-2">
        <Label>Tipo de Depósito *</Label>
        {isClienteMode ? (
          // Opções para CLIENTES: Matriz e Filial
          <Select
            value={formData.tipo_deposito === 'franquia' ? 'matriz' : 'filial'}
            onValueChange={(value) => {
              // Ambos são 'filial' no banco, mas diferenciamos no UI
              setFormData({
                ...formData,
                tipo_deposito: 'filial', // Clientes sempre criam como 'filial' no banco
                master_franqueado_id: '' // Clientes não precisam de master
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="matriz">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Matriz (Sede Principal)</div>
                    <div className="text-xs text-muted-foreground">
                      Depósito principal da sua empresa
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="filial">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Filial</div>
                    <div className="text-xs text-muted-foreground">
                      Filial ou depósito adicional da sua empresa
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          // Opções para ADMIN/OPERADOR: Franquia e Filial
          <Select
            value={formData.tipo_deposito}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                tipo_deposito: value as 'franquia' | 'filial',
                master_franqueado_id: value === 'filial' ? '' : formData.master_franqueado_id
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="franquia">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Franquia</div>
                    <div className="text-xs text-muted-foreground">
                      Gerenciada por franqueado parceiro - paga royalties
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="filial">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Filial</div>
                    <div className="text-xs text-muted-foreground">
                      Operada pela matriz - não paga royalties
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Depósito *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder={isClienteMode ? "Ex: Sede São Paulo, Filial Rio" : "Ex: São Paulo, Rio de Janeiro 2"}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="codigo_interno">Código Interno</Label>
          <Input
            id="codigo_interno"
            value={formData.codigo_interno}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo_interno: e.target.value.toUpperCase() }))}
            placeholder={isClienteMode ? "Ex: MATRIZ-001, FIL-SP" : "Ex: FRQ-002, SP-001"}
          />
        </div>
      </div>

      {/* Mostrar seletor de Franqueado Master APENAS para admin/operador criando franquia */}
      {!isClienteMode && formData.tipo_deposito === 'franquia' && (
        <>
          {franqueadosMasters.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Não há operadores disponíveis. É necessário cadastrar um usuário com perfil "Operador" antes de criar uma franquia.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="master">Franqueado Master *</Label>
              <Select 
                value={formData.master_franqueado_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, master_franqueado_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o franqueado master" />
                </SelectTrigger>
                <SelectContent>
                  {franqueadosMasters.map((master) => (
                    <SelectItem key={master.user_id} value={master.user_id}>
                      {master.nome || master.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.master_franqueado_id && (
                <p className="text-sm text-destructive">
                  Selecione um franqueado master para continuar
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Alerta informativo para admin/operador quando criar filial */}
      {!isClienteMode && formData.tipo_deposito === 'filial' && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Esta filial será operada pela matriz e não pagará royalties. Todo faturamento vai para a conta da franquia principal. O gestor da filial terá as mesmas permissões de um franqueado.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta informativo para clientes */}
      {isClienteMode && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
          <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Este depósito será operado pela sua empresa. Você terá acesso completo aos módulos WMS e TMS (se habilitados) para gerenciar suas operações de armazenagem e transporte.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição do depósito..."
          rows={3}
        />
      </div>

    </div>
  );
}
