import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useFranquias } from "@/hooks/useFranquias"
import { useCreateSolicitacaoFilial } from "@/hooks/useSolicitacoesFilial"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface SolicitarFilialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaMatriz: {
    id: string
    razao_social: string
  }
}

const DOCUMENTOS_NECESSARIOS = [
  { key: "contrato_social", label: "Contrato Social / Estatuto Social" },
  { key: "alteracao_contratual", label: "Última Alteração Contratual" },
  { key: "cartao_cnpj", label: "Cartão CNPJ da Matriz" },
  { key: "comprovante_endereco", label: "Comprovante de Endereço da Matriz" },
  { key: "inscricao_estadual", label: "Inscrição Estadual" },
  { key: "inscricao_municipal", label: "Inscrição Municipal" },
  { key: "cnd_federal", label: "CND Federal" },
  { key: "certidao_trabalhista", label: "Certidão de Débitos Trabalhistas" },
  { key: "rg_socios", label: "RG dos Sócios" },
  { key: "cpf_socios", label: "CPF dos Sócios" },
  { key: "comprovante_endereco_socios", label: "Comprovante de Endereço dos Sócios" },
]

export function SolicitarFilialDialog({ open, onOpenChange, empresaMatriz }: SolicitarFilialDialogProps) {
  const [depositoId, setDepositoId] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [documentos, setDocumentos] = useState<Record<string, File>>({})
  const [uploading, setUploading] = useState(false)
  
  const { data: franquias = [] } = useFranquias()
  const createSolicitacao = useCreateSolicitacaoFilial()

  const handleFileChange = (key: string, file: File | null) => {
    if (file) {
      setDocumentos(prev => ({ ...prev, [key]: file }))
    } else {
      setDocumentos(prev => {
        const newDocs = { ...prev }
        delete newDocs[key]
        return newDocs
      })
    }
  }

  const uploadDocumentos = async (): Promise<Record<string, string>> => {
    const uploadedUrls: Record<string, string> = {}
    
    for (const [key, file] of Object.entries(documentos)) {
      const filePath = `solicitacoes_filial/${empresaMatriz.id}/${Date.now()}_${file.name}`
      
      const { error: uploadError, data } = await supabase.storage
        .from('documentos')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Erro ao fazer upload de ${file.name}: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath)

      uploadedUrls[key] = publicUrl
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    if (!depositoId) {
      toast.error("Selecione um depósito")
      return
    }

    if (Object.keys(documentos).length === 0) {
      toast.error("Faça upload de pelo menos um documento")
      return
    }

    try {
      setUploading(true)
      const documentosUrls = await uploadDocumentos()
      
      await createSolicitacao.mutateAsync({
        empresa_matriz_id: empresaMatriz.id,
        deposito_id: depositoId,
        documentos: documentosUrls,
        observacoes: observacoes || undefined
      })

      onOpenChange(false)
      setDepositoId("")
      setObservacoes("")
      setDocumentos({})
    } catch (error) {
      console.error("Erro ao criar solicitação:", error)
      toast.error("Erro ao enviar solicitação")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Abertura de Filial</DialogTitle>
          <DialogDescription>
            Empresa Matriz: <strong>{empresaMatriz.razao_social}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Após enviar a solicitação, nossa equipe irá analisar os documentos e entrar em contato 
            para prosseguir com a abertura da filial.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposito">Depósito *</Label>
            <Select value={depositoId} onValueChange={setDepositoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                {franquias.map(franquia => (
                  <SelectItem key={franquia.id} value={franquia.id}>
                    {franquia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Documentos Necessários</Label>
            <div className="grid grid-cols-1 gap-3">
              {DOCUMENTOS_NECESSARIOS.map(doc => (
                <div key={doc.key} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor={doc.key} className="text-sm">
                      {doc.label}
                    </Label>
                  </div>
                  <Input
                    id={doc.key}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="max-w-[200px]"
                    onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                  />
                  {documentos[doc.key] && (
                    <span className="text-sm text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a solicitação..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={uploading || !depositoId || Object.keys(documentos).length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Enviando..." : "Solicitar Filial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
