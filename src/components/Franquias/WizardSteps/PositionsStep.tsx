import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calculator, Sparkles, Search, Trash2, AlertCircle } from "lucide-react";
import { StoragePosition, FranquiaFormData } from "../FranquiaWizard";
import { WarehouseLayoutDesigner, WarehouseLayout } from "../WarehouseLayoutDesigner";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Atualizar capacidade total quando layout mudar
  useEffect(() => {
    if (warehouseLayout) {
      const totalPositions = warehouseLayout.ruas * warehouseLayout.modulos * warehouseLayout.andares - warehouseLayout.posicoes_inativas.length;
      setFormData(prev => ({ 
        ...prev, 
        capacidade_total: totalPositions.toString() 
      }));
    }
  }, [warehouseLayout, setFormData]);

  const handleGeneratePositions = () => {
    if (!warehouseLayout) {
      toast({
        title: "Configure o layout primeiro",
        description: "Por favor, configure o layout do armazém antes de gerar as posições.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const generatedPositions: StoragePosition[] = [];
      
      for (let rua = 1; rua <= warehouseLayout.ruas; rua++) {
        for (let modulo = 1; modulo <= warehouseLayout.modulos; modulo++) {
          for (let andar = 1; andar <= warehouseLayout.andares; andar++) {
            const isInactive = warehouseLayout.posicoes_inativas.some(
              pos => pos.rua === rua && pos.modulo === modulo && pos.andar === andar
            );
            
            if (!isInactive) {
              const codigo = `R${String(rua).padStart(2, '0')}-M${String(modulo).padStart(2, '0')}-A${String(andar).padStart(2, '0')}`;
              generatedPositions.push({
                codigo,
                descricao: `Rua ${rua}, Módulo ${modulo}, Andar ${andar}`,
                capacidade_maxima: warehouseLayout.capacidade_por_posicao
              });
            }
          }
        }
      }
      
      setPositions(generatedPositions);
      setIsGenerating(false);
      
      toast({
        title: "Posições geradas",
        description: `${generatedPositions.length.toLocaleString()} posições foram geradas com sucesso.`,
      });
    }, 100);
  };

  const handleDeletePosition = (codigo: string) => {
    setPositions(prev => prev.filter(pos => pos.codigo !== codigo));
    toast({
      title: "Posição removida",
      description: `A posição ${codigo} foi removida.`,
    });
  };

  const filteredPositions = positions.filter(pos => 
    pos.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b pb-2">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Layout do Armazém e Posições de Estoque</h3>
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

      {/* Geração de Posições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gerar Posições de Estoque
          </CardTitle>
          <CardDescription>
            Clique no botão abaixo para gerar as posições baseadas no layout configurado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!warehouseLayout ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure o layout do armazém acima antes de gerar as posições
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleGeneratePositions}
                  disabled={isGenerating || !warehouseLayout}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>Gerando posições...</>
                  ) : positions.length > 0 ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regerar Posições ({positions.length.toLocaleString()} atuais)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Posições ({formData.capacidade_total || '0'} posições)
                    </>
                  )}
                </Button>
              </div>

              {positions.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary">
                        <Calculator className="w-5 h-5" />
                        <h4 className="font-medium">Posições Geradas</h4>
                      </div>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {positions.length.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      ✓ Pronto
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista de Posições Geradas */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Posições Geradas ({filteredPositions.length.toLocaleString()})
            </CardTitle>
            <CardDescription>
              Revise as posições geradas e remova aquelas que não deseja criar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabela de Posições */}
            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {searchTerm ? "Nenhuma posição encontrada" : "Nenhuma posição gerada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPositions.map((position) => (
                      <TableRow key={position.codigo}>
                        <TableCell className="font-mono font-medium">{position.codigo}</TableCell>
                        <TableCell className="text-muted-foreground">{position.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {position.capacidade_maxima || warehouseLayout?.capacidade_por_posicao || 1.2}t
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePosition(position.codigo)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}