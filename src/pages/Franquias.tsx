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

interface Franquia {
  id: string;
  nome: string;
  descricao: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
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
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    email: "",
    master_franqueado_id: "",
  });

  // Set page title and meta description
  useEffect(() => {
    document.title = "Franquias - Sistema de Gestão";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Gerencie franquias e seus franqueados masters no sistema de gestão.');
    }
  }, []);

  // Load franquias
  const { data: franquias = [], isLoading } = useQuery({
    queryKey: ["franquias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select(`
          *,
          master_franqueado:profiles!franquias_master_franqueado_id_fkey(nome, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map((item: any) => ({
        ...item,
        master_franqueado: item.master_franqueado || { nome: "", email: "" }
      })) as Franquia[];
    },
  });

  // Load franqueados masters available for assignment
  const { data: franqueadosMasters = [] } = useQuery({
    queryKey: ["franqueados-masters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          profiles!inner(user_id, nome, email)
        `)
        .eq("role", "franqueado");
      
      if (error) throw error;
      
      // Filter out franqueados that are already masters of existing franquias
      const existingMasters = franquias.map(f => f.master_franqueado_id);
      
      return (data ?? [])
        .map((item: any) => ({
          user_id: item.profiles.user_id,
          nome: item.profiles.nome,
          email: item.profiles.email,
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
    mutationFn: async (data: typeof formData) => {
      if (editingFranquia) {
        const { error } = await supabase
          .from("franquias")
          .update(data)
          .eq("id", editingFranquia.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("franquias")
          .insert(data);
        if (error) throw error;
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
      descricao: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      telefone: "",
      email: "",
      master_franqueado_id: "",
    });
    setEditingFranquia(null);
  };

  const openDialog = (franquia?: Franquia) => {
    if (franquia) {
      setEditingFranquia(franquia);
      setFormData({
        nome: franquia.nome,
        descricao: franquia.descricao || "",
        endereco: franquia.endereco || "",
        cidade: franquia.cidade || "",
        estado: franquia.estado || "",
        cep: franquia.cep || "",
        telefone: franquia.telefone || "",
        email: franquia.email || "",
        master_franqueado_id: franquia.master_franqueado_id,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.master_franqueado_id) {
      toast({
        title: "Dados incompletos",
        description: "Preencha ao menos o nome da franquia e selecione um franqueado master.",
        variant: "destructive",
      });
      return;
    }
    saveFranquia.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-muted-foreground">Carregando franquias...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Franquias</h1>
          <p className="text-muted-foreground">
            Gerencie as franquias e seus franqueados masters
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Building2 className="mr-2 h-4 w-4" />
              Nova Franquia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFranquia ? "Editar Franquia" : "Nova Franquia"}
              </DialogTitle>
              <DialogDescription>
                {editingFranquia 
                  ? "Atualize as informações da franquia"
                  : "Crie uma nova franquia e associe um franqueado master"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Franquia *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome da franquia"
                  />
                </div>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição da franquia"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@franquia.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveFranquia.isPending}>
                  {saveFranquia.isPending 
                    ? "Salvando..." 
                    : editingFranquia ? "Atualizar" : "Criar"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
              <Button onClick={() => openDialog()}>
                <Building2 className="mr-2 h-4 w-4" />
                Criar primeira franquia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {franquias.map((franquia) => (
              <Card key={franquia.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {franquia.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {franquia.master_franqueado?.nome || franquia.master_franqueado?.email}
                      </div>
                    </div>
                    <Badge variant={franquia.ativo ? "default" : "secondary"}>
                      {franquia.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {franquia.descricao && (
                    <p className="text-sm text-muted-foreground">{franquia.descricao}</p>
                  )}
                  
                  {(franquia.cidade || franquia.estado) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[franquia.cidade, franquia.estado].filter(Boolean).join(", ")}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(franquia)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFranquia.mutate(franquia.id)}
                      disabled={deleteFranquia.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Franquias;