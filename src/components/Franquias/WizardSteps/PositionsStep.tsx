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
    tipo_posicao: "prateleira",
    capacidade_maxima: ""
  });

  // Gerar posições automaticamente baseado no layout do armazém
  const generatePositionsFromLayout = (layout: WarehouseLayout) => {
    const newPositions: StoragePosition[] = [];
    
    for (let rua = 1; rua <= layout.ruas; rua++) {
      for (let modulo = 1; modulo <= layout.modulos; modulo++) {
        for (let andar = 1; andar <= layout.andares; andar++) {
          // Verificar se a posição não está inativa
          const isInactive = layout.posicoes_inativas.some(
            pos => pos.rua === rua && pos.modulo === modulo && pos.andar === andar
          );
          
          if (!isInactive) {
            const codigo = `R${String(rua).padStart(2, '0')}-M${String(modulo).padStart(2, '0')}-A${String(andar).padStart(2, '0')}`;
            newPositions.push({
              codigo,
              descricao: `Rua ${rua}, Módulo ${modulo}, Andar ${andar}`,
              tipo_posicao: "prateleira"
            });
          }
        }
      }
    }
    
    return newPositions;
  };

  const calculateTotalCapacity = (currentPositions: StoragePosition[]) => {
    const totalPositions = currentPositions.length;
    
    setFormData(prev => ({ 
      ...prev, 
      capacidade_total: totalPositions.toString() 
    }));
  };

  // Atualizar posições quando o layout do armazém mudar
  useEffect(() => {
    if (warehouseLayout) {
      const generatedPositions = generatePositionsFromLayout(warehouseLayout);
      setPositions(generatedPositions);
      calculateTotalCapacity(generatedPositions);
    }
  }, [warehouseLayout]);

  useEffect(() => {
    calculateTotalCapacity(positions);
  }, [positions, setFormData]);

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
          Baseado em {positions.length} posição(ões) configurada(s)
        </p>
      </div>

      {/* Layout Designer */}
      <div className="space-y-4">
        <h4 className="font-medium">Designer de Layout</h4>
        <p className="text-sm text-muted-foreground">
          Configure o layout do armazém. As posições serão geradas automaticamente baseadas nas dimensões definidas.
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

      {/* Manual Position Management */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Posições Geradas Automaticamente</h4>
          <p className="text-sm text-muted-foreground">
            {positions.length} posição(ões) gerada(s) baseado no layout do armazém
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Posição Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Editar Posição" : "Adicionar Posição Manual"}
              </DialogTitle>
              <DialogDescription>
                {editingIndex !== null ? "Edite os dados da posição gerada automaticamente" : "Adicione uma posição personalizada além das geradas pelo layout"}
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
                    -
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
          <p className="text-sm">Configure o layout do armazém acima para gerar posições automaticamente</p>
        </div>
      )}
    </div>
  );
}