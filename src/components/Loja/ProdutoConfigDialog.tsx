import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ClienteProduto, ClienteProdutoFormData } from "@/hooks/useClienteProdutos"
import { Loader2, Upload, X, Image } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface ProdutoConfigDialogProps {
  produto: ClienteProduto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: ClienteProdutoFormData) => void
  isSaving: boolean
}

const CATEGORIAS = [
  "Fertilizantes",
  "Defensivos",
  "Sementes",
  "Adjuvantes",
  "Inoculantes",
  "Nutrição Foliar",
  "Equipamentos",
  "Outros",
]

export function ProdutoConfigDialog({
  produto,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: ProdutoConfigDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<ClienteProdutoFormData>({
    preco_unitario: null,
    preco_promocional: null,
    categoria: null,
    descricao_anuncio: null,
    ativo_marketplace: false,
    ativo_loja_propria: false,
    quantidade_minima: 1,
    usar_estoque_real: true,
    imagens: [],
  })

  useEffect(() => {
    if (produto) {
      setFormData({
        preco_unitario: produto.preco_unitario,
        preco_promocional: produto.preco_promocional,
        categoria: produto.categoria,
        descricao_anuncio: produto.descricao_anuncio,
        ativo_marketplace: produto.ativo_marketplace,
        ativo_loja_propria: produto.ativo_loja_propria,
        quantidade_minima: produto.quantidade_minima,
        usar_estoque_real: produto.usar_estoque_real,
        imagens: Array.isArray(produto.imagens) ? produto.imagens : [],
      })
    }
  }, [produto])

  const handleSave = () => {
    if (!produto) return
    onSave(produto.id, formData)
    onOpenChange(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !produto) return

    setIsUploading(true)
    const newImages: string[] = [...(formData.imagens || [])]

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${produto.cliente_id}/${produto.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('produto-imagens')
          .upload(fileName, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          toast.error(`Erro ao enviar ${file.name}`)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('produto-imagens')
          .getPublicUrl(fileName)

        newImages.push(publicUrl)
      }

      setFormData(prev => ({ ...prev, imagens: newImages }))
      toast.success("Imagens enviadas com sucesso!")
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Erro ao enviar imagens")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...(formData.imagens || [])]
    newImages.splice(index, 1)
    setFormData(prev => ({ ...prev, imagens: newImages }))
  }

  if (!produto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Produto para Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info do produto (readonly) */}
          <div className="bg-muted p-3 rounded-lg space-y-1">
            <p className="font-medium">{produto.nome_produto}</p>
            <p className="text-sm text-muted-foreground">
              Código: {produto.codigo_produto || "N/A"} | Unidade: {produto.unidade_medida}
            </p>
          </div>

          {/* Imagens */}
          <div className="space-y-2">
            <Label>Fotos do Produto</Label>
            <div className="grid grid-cols-4 gap-2">
              {(formData.imagens || []).map((url, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {/* Add image button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Adicionar</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Adicione até 8 fotos do produto. Recomendado: 800x800px
            </p>
          </div>

          {/* Preço */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco">Preço Unitário (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.preco_unitario ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preco_unitario: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_promo">Preço Promocional (R$)</Label>
              <Input
                id="preco_promo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.preco_promocional ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    preco_promocional: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria ?? ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, categoria: value || null }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
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

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição para Anúncio</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o produto para os compradores..."
              value={formData.descricao_anuncio ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao_anuncio: e.target.value || null }))
              }
              rows={3}
            />
          </div>

          {/* Quantidade mínima */}
          <div className="space-y-2">
            <Label htmlFor="qtd_min">Quantidade Mínima</Label>
            <Input
              id="qtd_min"
              type="number"
              min="1"
              value={formData.quantidade_minima ?? 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantidade_minima: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Usar Estoque Real</Label>
                <p className="text-xs text-muted-foreground">
                  Sincronizar disponibilidade com estoque atual
                </p>
              </div>
              <Switch
                checked={formData.usar_estoque_real ?? true}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, usar_estoque_real: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Ativo no Marketplace</Label>
                <p className="text-xs text-muted-foreground">
                  Exibir no marketplace geral da AgroHub
                </p>
              </div>
              <Switch
                checked={formData.ativo_marketplace ?? false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, ativo_marketplace: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Ativo na Loja Própria</Label>
                <p className="text-xs text-muted-foreground">
                  Exibir na sua loja exclusiva
                </p>
              </div>
              <Switch
                checked={formData.ativo_loja_propria ?? false}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, ativo_loja_propria: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
