import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Download, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Fatura {
  id: string
  numero: string
  data_emissao: string
  data_vencimento: string
  valor: number
  status: 'pendente' | 'pago' | 'vencido'
  descricao: string
}

export default function Faturas() {
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null)

  const { data: faturas = [], isLoading } = useQuery<Fatura[]>({
    queryKey: ["faturas"],
    queryFn: async () => {
      // TODO: Implementar busca de faturas no banco
      // Por enquanto retorna dados mockados
      return [
        {
          id: "1",
          numero: "FAT-2024-001",
          data_emissao: "2024-01-15",
          data_vencimento: "2024-02-15",
          valor: 1500.00,
          status: "pago",
          descricao: "Fatura referente a Janeiro/2024"
        },
        {
          id: "2",
          numero: "FAT-2024-002",
          data_emissao: "2024-02-15",
          data_vencimento: "2024-03-15",
          valor: 1800.00,
          status: "pendente",
          descricao: "Fatura referente a Fevereiro/2024"
        }
      ]
    },
  })

  const getStatusBadge = (status: Fatura['status']) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      pago: { label: "Pago", variant: "default" as const },
      vencido: { label: "Vencido", variant: "destructive" as const }
    }
    
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">Carregando faturas...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie suas faturas
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faturas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </TableCell>
              </TableRow>
            ) : (
              faturas.map((fatura) => (
                <TableRow key={fatura.id}>
                  <TableCell className="font-medium">{fatura.numero}</TableCell>
                  <TableCell>{formatDate(fatura.data_emissao)}</TableCell>
                  <TableCell>{formatDate(fatura.data_vencimento)}</TableCell>
                  <TableCell>{formatCurrency(fatura.valor)}</TableCell>
                  <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                  <TableCell>{fatura.descricao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFatura(fatura)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // TODO: Implementar download da fatura
                          console.log("Download fatura:", fatura.id)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
