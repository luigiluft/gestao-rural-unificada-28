import { useState } from "react"
import { useLojaAnuncios, AnuncioFormData } from "@/hooks/useLojaAnuncios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AnuncioFormProps {
  onSuccess?: () => void
  anuncioParaEditar?: AnuncioFormData & { id: string }
}

const CATEGORIAS = [
  "Grãos",
  "Frutas",
  "Verduras",
  "Legumes",
  "Laticínios",
  "Carnes",
  "Ovos",
  "Mel",
  "Café",
  "Outros",
]

const UNIDADES = [
  { value: "kg", label: "Quilograma (kg)" },
  { value: "un", label: "Unidade (un)" },
  { value: "cx", label: "Caixa (cx)" },
  { value: "sc", label: "Saca (sc)" },
  { value: "lt", label: "Litro (lt)" },
  { value: "dz", label: "Dúzia (dz)" },
]

export function AnuncioForm({ onSuccess, anuncioParaEditar }: AnuncioFormProps) {
  const { criarAnuncio, isCriando, atualizarAnuncio, isAtualizando } = useLojaAnuncios()
  
  const [formData, setFormData] = useState<AnuncioFormData>({
    titulo: anuncioParaEditar?.titulo || "",
    descricao_anuncio: anuncioParaEditar?.descricao_anuncio || "",
    preco_unitario: anuncioParaEditar?.preco_unitario || 0,
    preco_promocional: anuncioParaEditar?.preco_promocional || undefined,
    unidade_venda: anuncioParaEditar?.unidade_venda || "kg",
    quantidade_minima: anuncioParaEditar?.quantidade_minima || 1,
    quantidade_disponivel: anuncioParaEditar?.quantidade_disponivel || undefined,
    visivel_marketplace: anuncioParaEditar?.visivel_marketplace ?? true,
    visivel_loja_propria: anuncioParaEditar?.visivel_loja_propria ?? true,
    categoria: anuncioParaEditar?.categoria || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (anuncioParaEditar?.id) {
      atualizarAnuncio(
        { id: anuncioParaEditar.id, ...formData },
        { onSuccess }
      )
    } else {
      criarAnuncio(formData, { onSuccess })
    }
  }

  const isLoading = isCriando || isAtualizando

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título do Anúncio *</Label>
          <Input
            id="titulo"
            placeholder="Ex: Café Especial - Grão Arábica"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            placeholder="Descreva seu produto..."
            value={formData.descricao_anuncio || ""}
            onChange={(e) => setFormData({ ...formData, descricao_anuncio: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade de Venda</Label>
            <Select
              value={formData.unidade_venda}
              onValueChange={(value) => setFormData({ ...formData, unidade_venda: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((un) => (
                  <SelectItem key={un.value} value={un.value}>
                    {un.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco">Preço (R$) *</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.preco_unitario || ""}
              onChange={(e) => setFormData({ ...formData, preco_unitario: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco-promo">Preço Promocional (R$)</Label>
            <Input
              id="preco-promo"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.preco_promocional || ""}
              onChange={(e) => setFormData({ ...formData, preco_promocional: parseFloat(e.target.value) || undefined })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qtd-minima">Quantidade Mínima</Label>
            <Input
              id="qtd-minima"
              type="number"
              min="1"
              value={formData.quantidade_minima || 1}
              onChange={(e) => setFormData({ ...formData, quantidade_minima: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qtd-disponivel">Quantidade Disponível</Label>
            <Input
              id="qtd-disponivel"
              type="number"
              min="0"
              placeholder="Ilimitado"
              value={formData.quantidade_disponivel || ""}
              onChange={(e) => setFormData({ ...formData, quantidade_disponivel: parseFloat(e.target.value) || undefined })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">Visibilidade</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Exibir no Marketplace AgroHub</Label>
            <p className="text-sm text-muted-foreground">
              Seu produto aparecerá na loja principal
            </p>
          </div>
          <Switch
            checked={formData.visivel_marketplace}
            onCheckedChange={(checked) => setFormData({ ...formData, visivel_marketplace: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Exibir na Minha Loja</Label>
            <p className="text-sm text-muted-foreground">
              Seu produto aparecerá na sua loja própria
            </p>
          </div>
          <Switch
            checked={formData.visivel_loja_propria}
            onCheckedChange={(checked) => setFormData({ ...formData, visivel_loja_propria: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading || !formData.titulo || !formData.preco_unitario}>
          {isLoading ? "Salvando..." : anuncioParaEditar ? "Salvar Alterações" : "Criar Anúncio"}
        </Button>
      </div>
    </form>
  )
}
