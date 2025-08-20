import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import { WarehouseLayoutDesigner, WarehouseLayout } from "../WarehouseLayoutDesigner";
import { FranquiaFormData } from "../FranquiaWizard";

interface LayoutStepProps {
  warehouseLayout: WarehouseLayout | null;
  setWarehouseLayout: React.Dispatch<React.SetStateAction<WarehouseLayout | null>>;
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
}

export function LayoutStep({ 
  warehouseLayout, 
  setWarehouseLayout, 
  formData, 
  setFormData 
}: LayoutStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <CheckCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Layout do Armazém (Opcional)</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="capacidade_total">Capacidade Total (m³)</Label>
          <Input
            id="capacidade_total"
            type="number"
            value={formData.capacidade_total}
            onChange={(e) => setFormData(prev => ({ ...prev, capacidade_total: e.target.value }))}
            placeholder="Ex: 1000"
          />
        </div>

        <div className="space-y-2">
          <Label>Designer de Layout</Label>
          <p className="text-sm text-muted-foreground">
            Configure o layout visual do armazém (opcional)
          </p>
          <div className="border rounded-lg p-4">
            <WarehouseLayoutDesigner
              layout={warehouseLayout}
              onLayoutChange={setWarehouseLayout}
              onCapacityChange={(capacity) => 
                setFormData(prev => ({ ...prev, capacidade_total: capacity.toString() }))
              }
            />
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <h4 className="font-medium">Pronto para finalizar!</h4>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Sua franquia está configurada e pronta para ser criada. As posições de estoque serão criadas automaticamente.
        </p>
      </div>
    </div>
  );
}