import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function EstoqueCleanup() {
  const [isLoading, setIsLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const { toast } = useToast()

  const handleCleanup = async () => {
    try {
      setIsLoading(true)
      console.log('Iniciando limpeza de dados órfãos...')

      // Call the cleanup function
      const { data, error } = await supabase.rpc('clean_orphaned_data')
      
      if (error) {
        console.error('Erro na limpeza:', error)
        throw error
      }

      console.log('Resultado da limpeza:', data)
      setCleanupResult(data)

      const result = data as any
      toast({
        title: "Limpeza concluída",
        description: `Limpeza executada com sucesso. ${result?.cleaned_movements || 0} movimentações órfãs removidas.`,
      })
    } catch (error) {
      console.error('Erro durante limpeza:', error)
      toast({
        title: "Erro na limpeza",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceRefresh = async () => {
    try {
      setIsLoading(true)
      console.log('Forçando refresh do estoque...')

      const { data, error } = await supabase.rpc('refresh_estoque_with_retry')
      
      if (error) {
        console.error('Erro no refresh:', error)
        throw error
      }

      console.log('Resultado do refresh:', data)

      toast({
        title: "Refresh concluído",
        description: data ? "Estoque atualizado com sucesso" : "Falha no refresh do estoque",
        variant: data ? "default" : "destructive"
      })
    } catch (error) {
      console.error('Erro durante refresh:', error)
      toast({
        title: "Erro no refresh",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Limpeza do Estoque
        </CardTitle>
        <CardDescription>
          Ferramenta para limpar dados órfãos e forçar atualização do estoque
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Esta ferramenta remove movimentações órfãs e força a atualização da view materializada do estoque.
            Use quando o estoque não refletir corretamente as entradas deletadas.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button 
            onClick={handleCleanup}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isLoading ? "Limpando..." : "Limpar Dados Órfãos"}
          </Button>

          <Button 
            onClick={handleForceRefresh}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {isLoading ? "Atualizando..." : "Forçar Refresh Estoque"}
          </Button>
        </div>

        {cleanupResult && (
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Resultado da última limpeza:</strong>
              <ul className="mt-2 text-sm list-disc list-inside">
                <li>Movimentações órfãs removidas: {(cleanupResult as any)?.cleaned_movements || 0}</li>
                <li>Pallets órfãos removidos: {(cleanupResult as any)?.cleaned_pallets || 0}</li>
                <li>Itens de pallet órfãos removidos: {(cleanupResult as any)?.cleaned_pallet_items || 0}</li>
                <li>Posições de pallet órfãs removidas: {(cleanupResult as any)?.cleaned_pallet_positions || 0}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}