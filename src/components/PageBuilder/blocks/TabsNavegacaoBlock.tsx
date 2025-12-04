import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, FileText } from "lucide-react"

interface TabsNavegacaoBlockConfig {
  mostrarSpot?: boolean
  mostrarCotacao?: boolean
  tabAtiva?: 'spot' | 'cotacao'
}

interface TabsNavegacaoBlockProps {
  config: TabsNavegacaoBlockConfig
  isPreview?: boolean
  onTabChange?: (tab: string) => void
}

export function TabsNavegacaoBlock({ config, isPreview, onTabChange }: TabsNavegacaoBlockProps) {
  const mostrarSpot = config.mostrarSpot !== false
  const mostrarCotacao = config.mostrarCotacao !== false

  if (!mostrarSpot && !mostrarCotacao) return null

  return (
    <div className="container mx-auto px-4 py-4">
      <Tabs defaultValue={config.tabAtiva || "spot"} onValueChange={onTabChange}>
        <TabsList className={isPreview ? 'h-8' : ''}>
          {mostrarSpot && (
            <TabsTrigger value="spot" className={`gap-2 ${isPreview ? 'text-xs px-2 py-1' : ''}`}>
              <Package className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
              Spot
            </TabsTrigger>
          )}
          {mostrarCotacao && (
            <TabsTrigger value="cotacao" className={`gap-2 ${isPreview ? 'text-xs px-2 py-1' : ''}`}>
              <FileText className={isPreview ? 'h-3 w-3' : 'h-4 w-4'} />
              Cotação
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  )
}
