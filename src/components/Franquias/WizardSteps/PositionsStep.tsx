import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Edit, Trash2, Calculator } from "lucide-react";
import { StoragePosition, FranquiaFormData } from "../FranquiaWizard";
import { WarehouseLayoutDesigner, WarehouseLayout } from "../WarehouseLayoutDesigner";
import { toast } from "@/hooks/use-toast";

interface PositionsStepProps {
  positions: StoragePosition[];
  setPositions: React.Dispatch<React.SetStateAction<StoragePosition[]>>;
  warehouseLayout: WarehouseLayout | null;
  setWarehouseLayout: React.Dispatch<React.SetStateAction<WarehouseLayout | null>>;
  formData: FranquiaFormData;
  setFormData: React.Dispatch<React.SetStateAction<FranquiaFormData>>;
}


export function PositionsStep({ 
  positions, 
  setPositions, 
  warehouseLayout, 
  setWarehouseLayout, 
  formData, 
  setFormData 
}: PositionsStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [positionFormData, setPositionFormData] = useState({
    codigo: "",
    descricao: "",
    capacidade_maxima: ""
  });

  // Calcular quantas posições serão geradas quando o layout mudar
  useEffect(() => {
    if (warehouseLayout) {
      const totalPositions = warehouseLayout.ruas * warehouseLayout.modulos * warehouseLayout.andares - warehouseLayout.posicoes_inativas.length;
      
      // Apenas atualizar a capacidade total, sem gerar as posições
      setFormData(prev => ({ 
        ...prev, 
        capacidade_total: totalPositions.toString() 
      }));
      
      toast({
        title: "Layout configurado",
        description: `${totalPositions.toLocaleString()} posições serão criadas quando você finalizar o cadastro`,
      });
    }
  }, [warehouseLayout, setFormData]);


  const resetForm = () => {
    setPositionFormData({
      codigo: "",
      descricao: "",
      capacidade_maxima: ""
    });
    setEditingIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if code already exists (except when editing)
    const codeExists = positions.some((pos, index) => 
      pos.codigo === positionFormData.codigo && index !== editingIndex
    );
    
    if (codeExists) {
      toast({
        title: "Código já existe",
        description: "Este código já está sendo usado por outra posição.",
        variant: "destructive",
      });
      return;
    }

    const newPosition: StoragePosition = {
      ...positionFormData,
      capacidade_maxima: positionFormData.capacidade_maxima ? Number(positionFormData.capacidade_maxima) : undefined
    };

    if (editingIndex !== null) {
      const newPositions = [...positions];
      newPositions[editingIndex] = newPosition;
      setPositions(newPositions);
    } else {
      setPositions([...positions, newPosition]);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (index: number) => {
    const position = positions[index];
    setPositionFormData({
      codigo: position.codigo,
      descricao: position.descricao,
      capacidade_maxima: position.capacidade_maxima?.toString() || ""
    });
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const applyTemplate = () => {
    // Função removida - posições são geradas automaticamente pelo layout
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Layout do Armazém e Posições de Estoque</h3>
      </div>

      {/* Capacidade Total Display */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary">
          <Calculator className="w-5 h-5" />
          <h4 className="font-medium">Capacidade Total Calculada</h4>
        </div>
        <p className="text-2xl font-bold text-primary mt-1">
          {formData.capacidade_total || '0'} posições
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Serão criadas quando você finalizar o cadastro
        </p>
      </div>

      {/* Layout Designer */}
      <WarehouseLayoutDesigner
        layout={warehouseLayout}
        onLayoutChange={setWarehouseLayout}
        onCapacityChange={(capacity) => {
          setFormData(prev => ({ 
            ...prev, 
            capacidade_total: capacity.toString() 
          }));
        }}
      />

      {/* Resumo do Layout */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Resumo do Layout
            </CardTitle>
            <CardDescription>
              As posições serão criadas automaticamente quando você finalizar o cadastro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {warehouseLayout ? (
              <>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{warehouseLayout.ruas}</div>
                    <div className="text-xs text-muted-foreground">Ruas</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{warehouseLayout.modulos}</div>
                    <div className="text-xs text-muted-foreground">Módulos</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{warehouseLayout.andares}</div>
                    <div className="text-xs text-muted-foreground">Andares</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de posições</span>
                    <span className="text-2xl font-bold text-primary">
                      {(warehouseLayout.ruas * warehouseLayout.modulos * warehouseLayout.andares - warehouseLayout.posicoes_inativas.length).toLocaleString()}
                    </span>
                  </div>
                  {warehouseLayout.posicoes_inativas.length > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Posições inativas</span>
                      <Badge variant="secondary">
                        {warehouseLayout.posicoes_inativas.length}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-center">
                  ℹ️ As posições serão geradas no formato <code className="bg-background px-2 py-1 rounded">R00-M00-A00</code> quando você criar o depósito
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Configure o layout do armazém para visualizar as posições que serão criadas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}