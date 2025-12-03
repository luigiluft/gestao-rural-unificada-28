import { useState, useEffect } from "react"
import { useLojaConfiguracao, LojaConfiguracao } from "@/hooks/useLojaConfiguracao"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Globe, Store, Phone, Mail, Clock } from "lucide-react"

export function LojaConfiguracoes() {
  const { configuracao, salvarConfiguracao, isSaving } = useLojaConfiguracao()
  
  const [formData, setFormData] = useState<Partial<LojaConfiguracao>>({
    nome_loja: "",
    descricao: "",
    whatsapp: "",
    email_contato: "",
    horario_atendimento: "",
    participar_marketplace: true,
    mostrar_endereco: false,
    mostrar_telefone: true,
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
      })
    }
  }, [configuracao])

  const handleSave = () => {
    salvarConfiguracao(formData)
  }

  return (
    <div className="space-y-6">
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
