import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { FranquiaFormData } from "../FranquiaWizard";

interface LegalInfoStepProps {
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
}

export function LegalInfoStep({ formData, setFormData }: LegalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <User className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Informações Legais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})/, '$1-$2');
              setFormData(prev => ({ ...prev, cnpj: value }));
            }}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
          <Input
            id="inscricao_estadual"
            value={formData.inscricao_estadual}
            onChange={(e) => setFormData(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
            placeholder="000.000.000.000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
              setFormData(prev => ({ ...prev, telefone: value }));
            }}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contato@franquia.com"
          />
        </div>
      </div>
    </div>
  );
}