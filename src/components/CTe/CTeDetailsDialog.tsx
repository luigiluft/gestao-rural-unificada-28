import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCTeDetails } from "@/hooks/useCTes"
import { LoadingState } from "@/components/ui/loading-state"
import { formatDate } from "@/lib/utils"

interface CTeDetailsDialogProps {
  cteId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CTeDetailsDialog({ cteId, open, onOpenChange }: CTeDetailsDialogProps) {
  const { data: cte, isLoading } = useCTeDetails(cteId || undefined)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'secondary'
      case 'autorizado':
        return 'default'
      case 'cancelado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho'
      case 'autorizado':
        return 'Autorizado'
      case 'cancelado':
        return 'Cancelado'
      case 'denegado':
        return 'Denegado'
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!cteId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do CT-e</DialogTitle>
            {cte && (
              <Badge variant={getStatusColor(cte.status)}>
                {getStatusLabel(cte.status)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <LoadingState text="Carregando detalhes do CT-e..." variant="spinner" />
        ) : cte ? (
          <div className="space-y-6">
            {/* Identificação */}
            <div>
              <h3 className="font-semibold mb-2">Identificação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Número</p>
                  <p className="font-medium">{cte.numero_cte}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Série/Modelo</p>
                  <p className="font-medium">{cte.serie} / {cte.modelo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Emissão</p>
                  <p className="font-medium">{formatDate(cte.data_emissao)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CFOP</p>
                  <p className="font-medium">{cte.cfop}</p>
                </div>
                {cte.chave_cte && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Chave de Acesso</p>
                    <p className="font-medium font-mono text-xs">{cte.chave_cte}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Emitente */}
            <div>
              <h3 className="font-semibold mb-2">Emitente (Transportadora)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nome/Razão Social</p>
                  <p className="font-medium">{cte.emitente_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{cte.emitente_cnpj}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IE</p>
                  <p className="font-medium">{cte.emitente_ie || '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Remetente */}
            <div>
              <h3 className="font-semibold mb-2">Remetente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nome/Razão Social</p>
                  <p className="font-medium">{cte.remetente_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{cte.remetente_cnpj}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cidade/UF</p>
                  <p className="font-medium">{cte.municipio_inicio_nome}/{cte.municipio_inicio_uf}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Destinatário */}
            <div>
              <h3 className="font-semibold mb-2">Destinatário</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">Nome/Razão Social</p>
                  <p className="font-medium">{cte.destinatario_nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNPJ/CPF</p>
                  <p className="font-medium">{cte.destinatario_cnpj}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cidade/UF</p>
                  <p className="font-medium">{cte.municipio_fim_nome}/{cte.municipio_fim_uf}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Valores */}
            <div>
              <h3 className="font-semibold mb-2">Valores da Prestação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor Total do Serviço</p>
                  <p className="font-medium">{formatCurrency(cte.valor_total_servico)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor a Receber</p>
                  <p className="font-medium">{formatCurrency(cte.valor_receber)}</p>
                </div>
                {cte.icms_valor > 0 && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Base ICMS</p>
                      <p className="font-medium">{formatCurrency(cte.icms_base_calculo)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor ICMS</p>
                      <p className="font-medium">{formatCurrency(cte.icms_valor)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Carga */}
            <div>
              <h3 className="font-semibold mb-2">Informações da Carga</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-muted-foreground">Produto Predominante</p>
                  <p className="font-medium">{cte.produto_predominante}</p>
                </div>
                {cte.quantidades && Array.isArray(cte.quantidades) && cte.quantidades.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Quantidades</p>
                    {(cte.quantidades as Array<any>).map((q: any, i: number) => (
                      <p key={i} className="font-medium">
                        {q.quantidade} {q.unidade} ({q.tipo})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {cte.numero_protocolo && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Protocolo de Autorização</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Número do Protocolo</p>
                      <p className="font-medium">{cte.numero_protocolo}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Autorização</p>
                      <p className="font-medium">{formatDate(cte.data_autorizacao)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{cte.codigo_status} - {cte.motivo_status}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">CT-e não encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  )
}