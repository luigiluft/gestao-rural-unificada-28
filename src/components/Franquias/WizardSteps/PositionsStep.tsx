import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Edit, Trash2, Zap, Calculator } from "lucide-react";
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

const POSITION_TEMPLATES = [
  {
    name: "Pequeno Depósito",
    description: "20 posições básicas para pequenos volumes",
    positions: Array.from({ length: 20 }, (_, i) => ({
      codigo: `P${String(i + 1).padStart(2, '0')}`,
      descricao: `Posição ${i + 1}`,
      tipo_posicao: "prateleira",
      capacidade_maxima: 100
    }))
  },
  {
    name: "Médio Depósito",
    description: "50 posições mistas para volumes médios",
    positions: [
      ...Array.from({ length: 30 }, (_, i) => ({
        codigo: `A${String(Math.floor(i / 10) + 1)}-${String((i % 10) + 1).padStart(2, '0')}`,
        descricao: `Prateleira ${Math.floor(i / 10) + 1} - Posição ${(i % 10) + 1}`,
        tipo_posicao: "prateleira",
        capacidade_maxima: 150
      })),
      ...Array.from({ length: 20 }, (_, i) => ({
        codigo: `P${String(i + 1).padStart(2, '0')}`,
        descricao: `Pallet ${i + 1}`,
        tipo_posicao: "pallet",
        capacidade_maxima: 500
      }))
    ]
  },
  {
    name: "Grande Depósito",
    description: "100 posições organizadas por setores",
    positions: [
      ...Array.from({ length: 60 }, (_, i) => ({
        codigo: `A${String(Math.floor(i / 12) + 1)}-${String((i % 12) + 1).padStart(2, '0')}`,
        descricao: `Setor A - Corredor ${Math.floor(i / 12) + 1} - Posição ${(i % 12) + 1}`,
        tipo_posicao: "prateleira",
        capacidade_maxima: 200
      })),
      ...Array.from({ length: 40 }, (_, i) => ({
        codigo: `P${String(Math.floor(i / 10) + 1)}-${String((i % 10) + 1).padStart(2, '0')}`,
        descricao: `Setor Pallets - Linha ${Math.floor(i / 10) + 1} - Posição ${(i % 10) + 1}`,
        tipo_posicao: "pallet",
        capacidade_maxima: 800
      }))
    ]
  }
];

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
    tipo_posicao: "prateleira",
    capacidade_maxima: ""
  });

  const resetForm = () => {
    setPositionFormData({
      codigo: "",
      descricao: "",
      tipo_posicao: "prateleira",
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
      tipo_posicao: position.tipo_posicao,
      capacidade_maxima: position.capacidade_maxima?.toString() || ""
    });
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const applyTemplate = (template: typeof POSITION_TEMPLATES[0]) => {
    setPositions(template.positions);
    calculateTotalCapacity(template.positions);
    toast({
      title: "Template aplicado",
      description: `${template.positions.length} posições foram criadas com base no template "${template.name}".`,
    });
  };

  const calculateTotalCapacity = (currentPositions: StoragePosition[]) => {
    const totalCapacity = currentPositions.reduce((sum, pos) => {
      return sum + (pos.capacidade_maxima || 0);
    }, 0);
    
    setFormData(prev => ({ 
      ...prev, 
      capacidade_total: totalCapacity.toString() 
    }));
  };

  useEffect(() => {
    calculateTotalCapacity(positions);
  }, [positions, setFormData]);

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
          {formData.capacidade_total || '0'} kg
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Baseado em {positions.length} posição(ões) configurada(s)
        </p>
      </div>

      {/* Layout Designer */}
      <div className="space-y-4">
        <h4 className="font-medium">Designer de Layout (Opcional)</h4>
        <p className="text-sm text-muted-foreground">
          Configure o layout visual do armazém. As posições criadas automaticamente serão sincronizadas com a lista abaixo.
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

      {/* Templates */}
      <div className="space-y-4">
        <h4 className="font-medium">Templates Predefinidos</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {POSITION_TEMPLATES.map((template, index) => (
            <Card key={index} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  {template.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => applyTemplate(template)}
                >
                  Aplicar ({template.positions.length} posições)
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Manual Creation */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Posições Configuradas</h4>
          <p className="text-sm text-muted-foreground">
            {positions.length} posição(ões) configurada(s)
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-1" />
              Nova Posição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Editar Posição" : "Nova Posição"}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null ? "Edite os dados da posição" : "Adicione uma nova posição de estoque"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código da Posição *</Label>
                <Input
                  id="codigo"
                  value={positionFormData.codigo}
                  onChange={(e) => setPositionFormData({ ...positionFormData, codigo: e.target.value })}
                  placeholder="Ex: A01-01-01, P001"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={positionFormData.descricao}
                  onChange={(e) => setPositionFormData({ ...positionFormData, descricao: e.target.value })}
                  placeholder="Descrição da posição..."
                />
              </div>
              
              <div>
                <Label htmlFor="tipo_posicao">Tipo de Posição</Label>
                <Select 
                  value={positionFormData.tipo_posicao} 
                  onValueChange={(value) => setPositionFormData({ ...positionFormData, tipo_posicao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prateleira">Prateleira</SelectItem>
                    <SelectItem value="pallet">Pallet</SelectItem>
                    <SelectItem value="container">Container</SelectItem>
                    <SelectItem value="gaveta">Gaveta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="capacidade_maxima">Capacidade Máxima (kg)</Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  value={positionFormData.capacidade_maxima}
                  onChange={(e) => setPositionFormData({ ...positionFormData, capacidade_maxima: e.target.value })}
                  placeholder="Capacidade em kg..."
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingIndex !== null ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Positions Table */}
      {positions.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {position.codigo}
                  </TableCell>
                  <TableCell>{position.descricao || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {position.tipo_posicao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {position.capacidade_maxima ? `${position.capacidade_maxima} kg` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {positions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma posição configurada</p>
          <p className="text-sm">Use um template ou crie posições manualmente</p>
        </div>
      )}
    </div>
  );
}