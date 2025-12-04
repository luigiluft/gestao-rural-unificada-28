import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Save, Loader2, Upload, X, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaMatriz, EmpresaMatrizData } from "@/hooks/useEmpresaMatriz";
import { useQueryClient } from "@tanstack/react-query";

export default function EmpresaMatriz() {
  const { data: empresaData, isLoading } = useEmpresaMatriz();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [semNumero, setSemNumero] = useState(false);
  const [semComplemento, setSemComplemento] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EmpresaMatrizData>({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    horario_funcionamento: "",
    logo_url: ""
  });

  useEffect(() => {
    if (empresaData) {
      setFormData(empresaData);
      setSemNumero(empresaData.numero === "S/N");
      setSemComplemento(empresaData.complemento === "-" || empresaData.complemento === "");
    }
  }, [empresaData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSemNumeroChange = (checked: boolean) => {
    setSemNumero(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, numero: "S/N" }));
    } else {
      setFormData(prev => ({ ...prev, numero: "" }));
    }
  };

  const handleSemComplementoChange = (checked: boolean) => {
    setSemComplemento(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, complemento: "-" }));
    } else {
      setFormData(prev => ({ ...prev, complemento: "" }));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `empresa-matriz-logo.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error);
      toast.error("Erro ao fazer upload do logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updates = Object.entries(formData).map(([key, value]) => ({
        chave: `empresa_matriz_${key}`,
        valor: value,
        descricao: `Configuração da empresa matriz - ${key}`
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("configuracoes_sistema")
          .upsert(
            { 
              chave: update.chave, 
              valor: update.valor,
              descricao: update.descricao,
              updated_at: new Date().toISOString()
            },
            { onConflict: "chave" }
          );

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["empresa-matriz"] });
      toast.success("Informações da empresa atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar as informações da empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empresa Matriz</h1>
        <p className="text-muted-foreground mt-2">
          Configure as informações da empresa responsável pela plataforma. Esses dados serão exibidos no site institucional.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações legais e identificação da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo da Plataforma</Label>
                <p className="text-sm text-muted-foreground">
                  Este logo será exibido no site institucional, marketplace e lojas dos clientes.
                </p>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="h-20 w-20 object-contain rounded-lg border bg-background"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {formData.logo_url ? "Trocar Logo" : "Enviar Logo"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    name="razao_social"
                    value={formData.razao_social}
                    onChange={handleInputChange}
                    placeholder="Razão Social da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleInputChange}
                    placeholder="Nome fantasia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario_funcionamento">Horário de Funcionamento</Label>
                  <Input
                    id="horario_funcionamento"
                    name="horario_funcionamento"
                    value={formData.horario_funcionamento}
                    onChange={handleInputChange}
                    placeholder="Seg - Sex: 8h às 18h"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>
                Informações de contato exibidas no site
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@empresa.com.br"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço da Sede</CardTitle>
              <CardDescription>
                Localização da matriz que será exibida no mapa do site
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="endereco">Logradouro</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="numero">Número</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sem_numero"
                      checked={semNumero}
                      onCheckedChange={handleSemNumeroChange}
                    />
                    <Label htmlFor="sem_numero" className="text-sm font-normal cursor-pointer">
                      Sem número
                    </Label>
                  </div>
                </div>
                <Input
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="123"
                  disabled={semNumero}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="complemento">Complemento</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sem_complemento"
                      checked={semComplemento}
                      onCheckedChange={handleSemComplementoChange}
                    />
                    <Label htmlFor="sem_complemento" className="text-sm font-normal cursor-pointer">
                      Sem complemento
                    </Label>
                  </div>
                </div>
                <Input
                  id="complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  placeholder="Sala, Andar, etc."
                  disabled={semComplemento}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  placeholder="Bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Informações
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
