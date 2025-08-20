import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, User, Package, CheckCircle } from "lucide-react";
import { BasicInfoStep } from "./WizardSteps/BasicInfoStep";
import { AddressStep } from "./WizardSteps/AddressStep";
import { LegalInfoStep } from "./WizardSteps/LegalInfoStep";
import { PositionsStep } from "./WizardSteps/PositionsStep";

import { WarehouseLayout } from "./WarehouseLayoutDesigner";

export interface FranquiaFormData {
  nome: string;
  codigo_interno: string;
  descricao: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  cnpj: string;
  inscricao_estadual: string;
  telefone: string;
  email: string;
  capacidade_total: string;
  layout_armazem: string;
  master_franqueado_id: string;
}

export interface StoragePosition {
  codigo: string;
  descricao: string;
  tipo_posicao: string;
  capacidade_maxima?: number;
}

interface FranquiaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    formData: FranquiaFormData;
    positions: StoragePosition[];
    layout: WarehouseLayout | null;
  }) => void;
  editingFranquia?: any;
  franqueadosMasters: any[];
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: "Informações Básicas", icon: Building2 },
  { id: 2, title: "Endereço", icon: MapPin },
  { id: 3, title: "Informações Legais", icon: User },
  { id: 4, title: "Layout e Posições", icon: Package },
];

export function FranquiaWizard({
  open,
  onOpenChange,
  onSubmit,
  editingFranquia,
  franqueadosMasters,
  isLoading = false
}: FranquiaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FranquiaFormData>({
    nome: "",
    codigo_interno: "",
    descricao: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    cnpj: "",
    inscricao_estadual: "",
    telefone: "",
    email: "",
    capacidade_total: "",
    layout_armazem: "",
    master_franqueado_id: "",
  });
  
  const [positions, setPositions] = useState<StoragePosition[]>([]);
  const [warehouseLayout, setWarehouseLayout] = useState<WarehouseLayout | null>(null);

  // Reset form when dialog opens/closes or editing changes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setPositions([]);
      setWarehouseLayout(null);
    }
    
    if (editingFranquia && open) {
      setFormData({
        nome: editingFranquia.nome,
        codigo_interno: editingFranquia.codigo_interno || "",
        descricao: editingFranquia.descricao || "",
        endereco: editingFranquia.endereco || "",
        numero: editingFranquia.numero || "",
        complemento: editingFranquia.complemento || "",
        bairro: editingFranquia.bairro || "",
        cidade: editingFranquia.cidade || "",
        estado: editingFranquia.estado || "",
        cep: editingFranquia.cep || "",
        cnpj: editingFranquia.cnpj || "",
        inscricao_estadual: editingFranquia.inscricao_estadual || "",
        telefone: editingFranquia.telefone || "",
        email: editingFranquia.email || "",
        capacidade_total: editingFranquia.capacidade_total?.toString() || "",
        layout_armazem: editingFranquia.layout_armazem || "",
        master_franqueado_id: editingFranquia.master_franqueado_id,
      });
      
      const layoutData = editingFranquia.layout_armazem ? JSON.parse(editingFranquia.layout_armazem) : null;
      setWarehouseLayout(layoutData);
    } else if (!editingFranquia && open) {
      setFormData({
        nome: "",
        codigo_interno: "",
        descricao: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        cnpj: "",
        inscricao_estadual: "",
        telefone: "",
        email: "",
        capacidade_total: "",
        layout_armazem: "",
        master_franqueado_id: "",
      });
    }
  }, [open, editingFranquia]);

  const progress = (currentStep / STEPS.length) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.nome && formData.master_franqueado_id);
      case 2:
        return !!(formData.cidade && formData.estado);
      case 3:
        return true; // Legal info is optional
      case 4:
        return positions.length > 0; // Require at least one position
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    if (validateStep(currentStep)) {
      onSubmit({
        formData,
        positions,
        layout: warehouseLayout
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            setFormData={setFormData}
            franqueadosMasters={franqueadosMasters}
          />
        );
      case 2:
        return (
          <AddressStep
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <LegalInfoStep
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 4:
        return (
          <PositionsStep
            positions={positions}
            setPositions={setPositions}
            warehouseLayout={warehouseLayout}
            setWarehouseLayout={setWarehouseLayout}
            formData={formData}
            setFormData={setFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFranquia ? "Editar Franquia" : "Nova Franquia"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep} de {STEPS.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Steps Navigation */}
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isValid = validateStep(step.id);
              
              return (
                <Card 
                  key={step.id} 
                  className={`flex-1 min-w-0 cursor-pointer transition-colors hover:bg-accent/50 ${
                    isCurrent ? 'border-primary bg-primary/5' : 
                    isCompleted ? 'border-green-500 bg-green-50' : 
                    'border-muted'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <Icon className={`w-3 h-3 ${
                        isCurrent ? 'text-primary' : 
                        isCompleted ? 'text-green-600' : 
                        'text-muted-foreground'
                      }`} />
                      <span className="truncate">{step.title}</span>
                      {isCompleted && <Badge variant="secondary" className="text-xs">✓</Badge>}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              {currentStep === STEPS.length ? (
                <Button
                  onClick={handleFinish}
                  disabled={!validateStep(currentStep) || isLoading}
                >
                  {isLoading ? "Criando..." : editingFranquia ? "Atualizar" : "Criar Franquia"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                >
                  Próximo
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}