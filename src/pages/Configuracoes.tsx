import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Palette, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function Configuracoes() {
  const [primaryColor, setPrimaryColor] = useState("#22c55e")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    const savedColor = localStorage.getItem("agro-primary-color")
    const savedLogo = localStorage.getItem("agro-logo-url")
    
    if (savedColor) {
      setPrimaryColor(savedColor)
      updateCSSVariable("--primary", savedColor)
    }
    
    if (savedLogo) {
      setLogoPreview(savedLogo)
    }
  }, [])

  const updateCSSVariable = (variable: string, color: string) => {
    // Converter hex para HSL
    const hex = color.replace("#", "")
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
        default: h = 0
      }
      h /= 6
    }

    const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
    document.documentElement.style.setProperty(variable, hsl)
  }

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value
    setPrimaryColor(newColor)
    updateCSSVariable("--primary", newColor)
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("A imagem deve ter no máximo 2MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem")
        return
      }

      setLogoFile(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      // Salvar cor no localStorage
      localStorage.setItem("agro-primary-color", primaryColor)
      
      // Salvar logo no localStorage (em uma aplicação real, enviaria para servidor)
      if (logoPreview) {
        localStorage.setItem("agro-logo-url", logoPreview)
      }
      
      // Aplicar mudanças imediatamente
      updateCSSVariable("--primary", primaryColor)
      
      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const defaultColor = "#22c55e"
    setPrimaryColor(defaultColor)
    setLogoFile(null)
    setLogoPreview(null)
    
    // Remover do localStorage
    localStorage.removeItem("agro-primary-color")
    localStorage.removeItem("agro-logo-url")
    
    // Resetar CSS
    updateCSSVariable("--primary", defaultColor)
    
    toast.success("Configurações restauradas para o padrão")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize a aparência da plataforma
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload de Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo da Plataforma
            </CardTitle>
            <CardDescription>
              Faça upload de uma imagem para substituir o logo atual (máx. 2MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Preview do logo" 
                      className="h-20 w-auto object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para enviar</span> ou arraste
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG ou SVG (máx. 2MB)</p>
                    </>
                  )}
                </div>
                <Input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
            
            {logoPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLogoFile(null)
                  setLogoPreview(null)
                }}
              >
                Remover Imagem
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Seletor de Cor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cor Primária
            </CardTitle>
            <CardDescription>
              Escolha a cor de destaque da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor de Destaque</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={handleColorChange}
                  className="w-16 h-12 p-1 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={handleColorChange}
                  className="flex-1"
                  placeholder="#22c55e"
                />
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="space-y-2">
                <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                  Botão Primário
                </Button>
                <div 
                  className="w-full h-2 rounded"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Restaurar Padrão
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}