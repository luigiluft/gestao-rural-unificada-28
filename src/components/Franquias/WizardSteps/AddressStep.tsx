import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import { FranquiaFormData } from "../FranquiaWizard";

interface AddressStepProps {
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
}

export function AddressStep({ formData, setFormData }: AddressStepProps) {
  const [semNumero, setSemNumero] = useState(false);
  const [semComplemento, setSemComplemento] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Endereço Completo</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="endereco">Logradouro</Label>
          <Input
            id="endereco"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            placeholder="Ex: Rua das Flores, Avenida Brasil"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="numero">Número</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="sem-numero"
                checked={semNumero}
                onCheckedChange={(checked) => {
                  setSemNumero(checked);
                  if (checked) {
                    setFormData(prev => ({ ...prev, numero: 'S/N' }));
                  } else {
                    setFormData(prev => ({ ...prev, numero: '' }));
                  }
                }}
              />
              <Label htmlFor="sem-numero" className="text-sm text-muted-foreground cursor-pointer">
                Sem número
              </Label>
            </div>
          </div>
          <Input
            id="numero"
            value={formData.numero}
            onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
            placeholder="123"
            disabled={semNumero}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="complemento">Complemento</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="sem-complemento"
                checked={semComplemento}
                onCheckedChange={(checked) => {
                  setSemComplemento(checked);
                  if (checked) {
                    setFormData(prev => ({ ...prev, complemento: '-' }));
                  } else {
                    setFormData(prev => ({ ...prev, complemento: '' }));
                  }
                }}
              />
              <Label htmlFor="sem-complemento" className="text-sm text-muted-foreground cursor-pointer">
                Sem complemento
              </Label>
            </div>
          </div>
          <Input
            id="complemento"
            value={formData.complemento}
            onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
            placeholder="Ex: Sala 101, Galpão A"
            disabled={semComplemento}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input
            id="bairro"
            value={formData.bairro}
            onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
            placeholder="Ex: Centro, Jardim Paulista"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade *</Label>
          <Input
            id="cidade"
            value={formData.cidade}
            onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
            placeholder="São Paulo"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado *</Label>
          <Input
            id="estado"
            value={formData.estado}
            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
            placeholder="SP"
            maxLength={2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
              setFormData(prev => ({ ...prev, cep: value }));
            }}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
      </div>
    </div>
  );
}