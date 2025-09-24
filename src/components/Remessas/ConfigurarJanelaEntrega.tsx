import { useState } from 'react'
import { Calendar, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ConfigurarJanelaEntregaProps {
  remessaId: string
  onSuccess?: () => void
}

export function ConfigurarJanelaEntrega({ remessaId, onSuccess }: ConfigurarJanelaEntregaProps) {
  const [open, setOpen] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  
  const queryClient = useQueryClient()

  const configurarJanelaMutation = useMutation({
    mutationFn: async ({ inicio, fim }: { inicio: string; fim: string }) => {
      const { error } = await supabase
        .from('saidas')
        .update({
          data_inicio_janela: inicio,
          data_fim_janela: fim
        })
        .eq('id', remessaId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remessas'] })
      toast.success('Janela de entrega configurada com sucesso!')
      setOpen(false)
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Erro ao configurar janela:', error)
      toast.error('Erro ao configurar janela de entrega')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dataInicio || !dataFim) {
      toast.error('Preencha as datas de início e fim')
      return
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast.error('Data de início deve ser anterior à data de fim')
      return
    }

    configurarJanelaMutation.mutate({ inicio: dataInicio, fim: dataFim })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Configurar Janela
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Janela de Entrega</DialogTitle>
          <DialogDescription>
            Defina o período em que esta remessa deve ser entregue
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data de Início da Janela</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data de Fim da Janela</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={configurarJanelaMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {configurarJanelaMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}