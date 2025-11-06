import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Building, Info } from "lucide-react";
import { FranquiaFormData } from "../FranquiaWizard";

interface BasicInfoStepProps {
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
  franqueadosMasters: any[];
}

export function BasicInfoStep({ formData, setFormData, franqueadosMasters }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
      </div>
      
      <div className="space-y-2">
        <Label>Tipo de Depósito *</Label>
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
                    Gerenciada por franqueado parceiro
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
                    Operada diretamente pela matriz
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Depósito *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: São Paulo, Rio de Janeiro 2"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="codigo_interno">Código Interno</Label>
          <Input
            id="codigo_interno"
            value={formData.codigo_interno}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo_interno: e.target.value.toUpperCase() }))}
            placeholder="Ex: FRQ-002, SP-001"
          />
        </div>
      </div>

      {formData.tipo_deposito === 'franquia' && (
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
        </div>
      )}

      {formData.tipo_deposito === 'filial' && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Esta filial será operada diretamente pela matriz. Não há franqueado associado.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição da franquia..."
          rows={3}
        />
      </div>

    </div>
  );
}