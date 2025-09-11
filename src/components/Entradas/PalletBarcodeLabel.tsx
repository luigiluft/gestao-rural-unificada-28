import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, Printer, QrCode } from 'lucide-react'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PalletBarcodeLabelProps {
  pallet: {
    id: string
    numero_pallet: number
    codigo_barras?: string
    quantidade_atual: number
    entrada_pallet_itens?: Array<{
      quantidade: number
      entrada_itens: {
        nome_produto: string
        lote?: string
        data_validade?: string
      }
    }>
  }
  entradaData?: {
    data_entrada: string
    fornecedor?: {
      nome: string
    }
  }
}

export function PalletBarcodeLabel({ pallet, entradaData }: PalletBarcodeLabelProps) {
  const produto = pallet.entrada_pallet_itens?.[0]?.entrada_itens
  
  const handlePrint = () => {
    // Abrir janela de impressão
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const labelContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta Pallet ${pallet.numero_pallet}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              font-size: 14px;
              line-height: 1.4;
            }
            .label {
              width: 100mm;
              height: 60mm;
              border: 2px solid #000;
              padding: 8px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
              margin-bottom: 4px;
            }
            .barcode {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              font-family: 'Libre Barcode 128 Text', monospace;
              letter-spacing: 2px;
              margin: 8px 0;
            }
            .info {
              font-size: 10px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .bold {
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .label { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <div class="bold">PALLET ${pallet.numero_pallet}</div>
              <div>AgroHub WMS</div>
            </div>
            
            <div class="barcode">
              ${pallet.codigo_barras || 'PLT' + pallet.numero_pallet.toString().padStart(8, '0')}
            </div>
            
            <div class="info">
              <div class="row">
                <span class="bold">Produto:</span>
                <span>${produto?.nome_produto || 'N/A'}</span>
              </div>
              <div class="row">
                <span class="bold">Quantidade:</span>
                <span>${pallet.quantidade_atual} un</span>
              </div>
              ${produto?.lote ? `
                <div class="row">
                  <span class="bold">Lote:</span>
                  <span>${produto.lote}</span>
                </div>
              ` : ''}
              ${produto?.data_validade ? `
                <div class="row">
                  <span class="bold">Validade:</span>
                  <span>${format(new Date(produto.data_validade), "dd/MM/yy", { locale: ptBR })}</span>
                </div>
              ` : ''}
              ${entradaData ? `
                <div class="row">
                  <span class="bold">Data Entrada:</span>
                  <span>${format(new Date(entradaData.data_entrada), "dd/MM/yy", { locale: ptBR })}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `
    
    printWindow.document.write(labelContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <Card className="w-fit">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Package className="h-4 w-4" />
              <span className="font-bold">PALLET {pallet.numero_pallet}</span>
            </div>
            <Badge variant="outline" className="text-xs">AgroHub WMS</Badge>
          </div>

          <Separator />

          {/* Código de Barras */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">Código de Barras</span>
            </div>
            <div className="font-mono text-lg font-bold bg-muted p-2 rounded border-2 border-dashed">
              {pallet.codigo_barras || `PLT${pallet.numero_pallet.toString().padStart(8, '0')}`}
            </div>
          </div>

          <Separator />

          {/* Informações do Produto */}
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-muted-foreground">Produto:</span>
                <p className="font-medium">{produto?.nome_produto || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Quantidade:</span>
                <p className="font-bold text-primary">{pallet.quantidade_atual} un</p>
              </div>
              {produto?.lote && (
                <div>
                  <span className="font-medium text-muted-foreground">Lote:</span>
                  <p className="font-mono">{produto.lote}</p>
                </div>
              )}
              {produto?.data_validade && (
                <div>
                  <span className="font-medium text-muted-foreground">Validade:</span>
                  <p>{format(new Date(produto.data_validade), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              )}
              {entradaData && (
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Data Entrada:</span>
                  <p>{format(new Date(entradaData.data_entrada), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Botão de Impressão */}
          <Button 
            onClick={handlePrint}
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Etiqueta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}