import { useState, useEffect, useRef } from "react"
import { useLojaConfiguracao, LojaConfiguracao } from "@/hooks/useLojaConfiguracao"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Globe, Store, Phone, Palette, Image, Upload, Loader2 } from "lucide-react"

export function LojaConfiguracoes() {
  const { 
    configuracao, 
    salvarConfiguracao, 
    isSaving,
    uploadLogo,
    isUploadingLogo,
    uploadBanner,
    isUploadingBanner
  } = useLojaConfiguracao()
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<Partial<LojaConfiguracao>>({
    nome_loja: "",
    descricao: "",
    whatsapp: "",
    email_contato: "",
    horario_atendimento: "",
    participar_marketplace: true,
    mostrar_endereco: false,
    mostrar_telefone: true,
    cor_primaria: "#22c55e",
    cor_secundaria: "#16a34a",
    cor_fundo: "#f8fafc",
  })

  useEffect(() => {
    if (configuracao) {
      setFormData({
        nome_loja: configuracao.nome_loja || "",
        descricao: configuracao.descricao || "",
        whatsapp: configuracao.whatsapp || "",
        email_contato: configuracao.email_contato || "",
        horario_atendimento: configuracao.horario_atendimento || "",
        participar_marketplace: configuracao.participar_marketplace,
        mostrar_endereco: configuracao.mostrar_endereco,
        mostrar_telefone: configuracao.mostrar_telefone,
        cor_primaria: configuracao.cor_primaria || "#22c55e",
        cor_secundaria: configuracao.cor_secundaria || "#16a34a",
        cor_fundo: configuracao.cor_fundo || "#f8fafc",
      })
    }
  }, [configuracao])

  const handleSave = () => {
    salvarConfiguracao(formData)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadLogo(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadBanner(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Identidade Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalização Visual
          </CardTitle>
          <CardDescription>
            Defina as cores e imagens da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload de Logo */}
          <div className="space-y-2">
            <Label>Logo da Loja</Label>
            <div className="flex items-center gap-4">
              {configuracao?.logo_url ? (
                <div className="w-20 h-20 rounded-lg border overflow-hidden bg-muted">
                  <img 
                    src={configuracao.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploadingLogo ? "Enviando..." : "Enviar Logo"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 200x200px, PNG ou JPG
                </p>
              </div>
            </div>
          </div>

          {/* Upload de Banner */}
          <div className="space-y-2">
            <Label>Banner da Loja</Label>
            <div className="space-y-2">
              {configuracao?.banner_url ? (
                <div className="w-full h-32 rounded-lg border overflow-hidden bg-muted">
                  <img 
                    src={configuracao.banner_url} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sem banner</p>
                  </div>
                </div>
              )}
              <div>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  {isUploadingBanner ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploadingBanner ? "Enviando..." : "Enviar Banner"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 1200x300px, PNG ou JPG
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cor_primaria">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_primaria"
                  value={formData.cor_primaria || "#22c55e"}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <Input
                  value={formData.cor_primaria || ""}
                  onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_secundaria">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_secundaria"
                  value={formData.cor_secundaria || "#16a34a"}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <Input
                  value={formData.cor_secundaria || ""}
                  onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                  placeholder="#16a34a"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor_fundo">Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cor_fundo"
                  value={formData.cor_fundo || "#f8fafc"}
                  onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <Input
                  value={formData.cor_fundo || ""}
                  onChange={(e) => setFormData({ ...formData, cor_fundo: e.target.value })}
                  placeholder="#f8fafc"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div 
              className="p-4 rounded-lg border"
              style={{ backgroundColor: formData.cor_fundo || "#f8fafc" }}
            >
              <div className="flex items-center gap-3 mb-3">
                {configuracao?.logo_url ? (
                  <img 
                    src={configuracao.logo_url} 
                    alt="Logo" 
                    className="w-10 h-10 rounded object-contain"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.cor_primaria || "#22c55e" }}
                  >
                    {formData.nome_loja?.charAt(0)?.toUpperCase() || "L"}
                  </div>
                )}
                <span className="font-semibold">{formData.nome_loja || "Nome da Loja"}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: formData.cor_primaria || "#22c55e" }}
                >
                  Botão Primário
                </button>
                <button
                  className="px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: formData.cor_secundaria || "#16a34a" }}
                >
                  Botão Secundário
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identidade da Loja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Identidade da Loja
          </CardTitle>
          <CardDescription>
            Personalize como sua loja aparece para os compradores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Loja</Label>
            <Input
              id="nome"
              value={formData.nome_loja || ""}
              onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })}
              placeholder="Ex: Fazenda São João"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL da Loja</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/loja/</span>
              <Input
                id="slug"
                value={configuracao?.slug || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A URL é gerada automaticamente a partir do nome da loja
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Conte um pouco sobre sua fazenda/empresa..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
          <CardDescription>
            Como os clientes podem entrar em contato com você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ""}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email_contato || ""}
                onChange={(e) => setFormData({ ...formData, email_contato: e.target.value })}
                placeholder="contato@suafazenda.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horario">Horário de Atendimento</Label>
            <Input
              id="horario"
              value={formData.horario_atendimento || ""}
              onChange={(e) => setFormData({ ...formData, horario_atendimento: e.target.value })}
              placeholder="Ex: Seg a Sex, 8h às 18h"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibilidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Visibilidade e Privacidade
          </CardTitle>
          <CardDescription>
            Configure onde sua loja e informações aparecem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Participar do Marketplace AgroHub</Label>
              <p className="text-sm text-muted-foreground">
                Seus produtos aparecerão na loja principal junto com outros vendedores
              </p>
            </div>
            <Switch
              checked={formData.participar_marketplace}
              onCheckedChange={(checked) => setFormData({ ...formData, participar_marketplace: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Endereço</Label>
              <p className="text-sm text-muted-foreground">
                Exibir endereço completo na página da loja
              </p>
            </div>
            <Switch
              checked={formData.mostrar_endereco}
              onCheckedChange={(checked) => setFormData({ ...formData, mostrar_endereco: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Telefone</Label>
              <p className="text-sm text-muted-foreground">
                Exibir número de telefone/WhatsApp para contato direto
              </p>
            </div>
            <Switch
              checked={formData.mostrar_telefone}
              onCheckedChange={(checked) => setFormData({ ...formData, mostrar_telefone: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
