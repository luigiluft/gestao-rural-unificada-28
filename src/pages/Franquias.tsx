import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Building2, User, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WarehouseLayoutDesigner, type WarehouseLayout } from "@/components/Franquias/WarehouseLayoutDesigner";
import { FranquiaWizard } from "@/components/Franquias/FranquiaWizard";
import { useCreateStoragePosition, useBulkCreateStoragePositions } from "@/hooks/useStoragePositions";

interface Franquia {
  id: string;
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
  capacidade_total: number;
  layout_armazem: string;
  master_franqueado_id: string;
  ativo: boolean;
  created_at: string;
  master_franqueado?: {
    nome: string;
    email: string;
  };
}

interface FranqueadoMaster {
  user_id: string;
  nome: string;
  email: string;
}

const Franquias = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFranquia, setEditingFranquia] = useState<Franquia | null>(null);
  const createPosition = useCreateStoragePosition();
  const bulkCreatePositions = useBulkCreateStoragePositions();
  
  const [formData, setFormData] = useState({
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

  const [warehouseLayout, setWarehouseLayout] = useState<WarehouseLayout | null>(null);

  // Set page title and meta description
  useEffect(() => {
    document.title = "Franquias - AgroHub";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie franquias e seus franqueados masters no sistema de gestão.');
    }
  }, []);

  // Load franquias
  const { data: franquias = [], isLoading } = useQuery({
    queryKey: ["franquias"],
    queryFn: async () => {
      const { data: franquiasData, error } = await supabase
        .from("franquias")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Get master franqueado details separately
      const franquiasWithMaster = await Promise.all(
        (franquiasData || []).map(async (franquia) => {
          const { data: masterData } = await supabase
            .from("profiles")
            .select("nome, email")
            .eq("user_id", franquia.master_franqueado_id)
            .single();
          
          return {
            ...franquia,
            master_franqueado: masterData || { nome: "", email: "" }
          };
        })
      );
      
      return franquiasWithMaster as Franquia[];
    },
  });

  // Load franqueados masters available for assignment
  const { data: franqueadosMasters = [] } = useQuery({
    queryKey: ["franqueados-masters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .eq("role", "franqueado");
      
      if (error) throw error;
      
      // Filter out franqueados that are already masters of existing franquias
      const existingMasters = franquias.map(f => f.master_franqueado_id);
      
      return (data ?? [])
        .map((item: any) => ({
          user_id: item.user_id,
          nome: item.nome,
          email: item.email,
        }))
        .filter((fm: FranqueadoMaster) => 
          editingFranquia 
            ? fm.user_id === editingFranquia.master_franqueado_id || !existingMasters.includes(fm.user_id)
            : !existingMasters.includes(fm.user_id)
        ) as FranqueadoMaster[];
    },
    enabled: dialogOpen,
  });

  // Create or update franquia
  const saveFranquia = useMutation({
    mutationFn: async (data: {
      formData: typeof formData;
      positions: any[];
      layout: WarehouseLayout | null;
    }) => {
      console.log('saveFranquia received:', {
        positions: data.positions.length,
        layout: data.layout,
        isEditing: !!editingFranquia
      });

      const payload = {
        ...data.formData,
        capacidade_total: data.formData.capacidade_total ? parseFloat(data.formData.capacidade_total) : null,
        layout_armazem: data.layout ? JSON.stringify(data.layout) : null,
      };

      let franquiaId: string;

      if (editingFranquia) {
        const { error } = await supabase
          .from("franquias")
          .update(payload)
          .eq("id", editingFranquia.id);
        if (error) throw error;
        franquiaId = editingFranquia.id;

        // For edits, also handle position updates
        if (data.positions.length > 0) {
          // Delete existing positions for this franchise
          const { error: deleteError } = await supabase
            .from("storage_positions")
            .delete()
            .eq("deposito_id", franquiaId);
          
          if (deleteError) {
            console.error("Error deleting existing positions:", deleteError);
          }

          // Create new positions in bulk
          try {
            await bulkCreatePositions.mutateAsync({
              deposito_id: franquiaId,
              positions: data.positions
            });
            console.log(`Successfully created ${data.positions.length} positions in bulk`);
          } catch (positionError) {
            console.error("Error creating positions in bulk:", positionError);
          }
        }
      } else {
        const { data: result, error } = await supabase
          .from("franquias")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        franquiaId = result.id;

        // Create storage positions for new franquias
        if (data.positions.length > 0) {
          console.log(`Creating ${data.positions.length} positions for new franchise`);
          try {
            await bulkCreatePositions.mutateAsync({
              deposito_id: franquiaId,
              positions: data.positions
            });
            console.log(`Successfully created ${data.positions.length} positions in bulk for new franchise`);
          } catch (positionError) {
            console.error("Error creating positions in bulk:", positionError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franquias"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: editingFranquia ? "Franquia atualizada" : "Franquia criada",
        description: editingFranquia 
          ? "A franquia foi atualizada com sucesso." 
          : "A nova franquia foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao ${editingFranquia ? 'atualizar' : 'criar'} franquia: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete franquia
  const deleteFranquia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("franquias")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["franquias"] });
      toast({
        title: "Franquia excluída",
        description: "A franquia foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir franquia: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
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
    setWarehouseLayout(null);
  };

  const openDialog = (franquia?: Franquia) => {
    if (franquia) {
      setEditingFranquia(franquia);
      setFormData({
        nome: franquia.nome,
        codigo_interno: franquia.codigo_interno || "",
        descricao: franquia.descricao || "",
        endereco: franquia.endereco || "",
        numero: franquia.numero || "",
        complemento: franquia.complemento || "",
        bairro: franquia.bairro || "",
        cidade: franquia.cidade || "",
        estado: franquia.estado || "",
        cep: franquia.cep || "",
        cnpj: franquia.cnpj || "",
        inscricao_estadual: franquia.inscricao_estadual || "",
        telefone: franquia.telefone || "",
        email: franquia.email || "",
        capacidade_total: franquia.capacidade_total?.toString() || "",
        layout_armazem: franquia.layout_armazem || "",
        master_franqueado_id: franquia.master_franqueado_id,
      });
      
      // Parse warehouse layout if exists
      const layoutData = franquia.layout_armazem ? JSON.parse(franquia.layout_armazem) : null;
      setWarehouseLayout(layoutData);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  // This function is no longer used - wizard handles all data now

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Carregando franquias...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Franquias</h1>
          <p className="text-muted-foreground">
            Gerencie as franquias e seus franqueados masters
          </p>
        </div>
        <Button onClick={() => { setEditingFranquia(null); setDialogOpen(true); }}>
          <Building2 className="mr-2 h-4 w-4" />
          Nova Franquia
        </Button>
      </div>

      <div className="grid gap-6">
        {franquias.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma franquia cadastrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando sua primeira franquia para organizar seus franqueados.
              </p>
              <Button onClick={() => { setEditingFranquia(null); setDialogOpen(true); }}>
                <Building2 className="mr-2 h-4 w-4" />
                Criar primeira franquia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Lista de Franquias</CardTitle>
              <CardDescription>
                {franquias.length} franquias cadastradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Franqueado Master</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franquias.map((franquia) => (
                      <TableRow key={franquia.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{franquia.nome}</p>
                              {franquia.descricao && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{franquia.descricao}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {franquia.master_franqueado?.nome || franquia.master_franqueado?.email || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(franquia.cidade || franquia.estado) ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {[franquia.cidade, franquia.estado].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {franquia.email && (
                              <p className="text-sm">{franquia.email}</p>
                            )}
                            {franquia.telefone && (
                              <p className="text-sm text-muted-foreground">{franquia.telefone}</p>
                            )}
                            {!franquia.email && !franquia.telefone && (
                              <span className="text-muted-foreground text-sm">Não informado</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={franquia.ativo ? "default" : "secondary"}>
                            {franquia.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(franquia.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingFranquia(franquia); setDialogOpen(true); }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFranquia.mutate(franquia.id)}
                              disabled={deleteFranquia.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <FranquiaWizard
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => {
          console.log('Wizard onSubmit called with:', {
            formData: data.formData.nome,
            positions: data.positions.length,
            layout: data.layout
          });
          saveFranquia.mutate(data);
        }}
        editingFranquia={editingFranquia}
        franqueadosMasters={franqueadosMasters}
        isLoading={saveFranquia.isPending}
      />
    </div>
  );
};

export default Franquias;