import { useState, useEffect } from "react"
import { useContratos, useContratoStats } from "@/hooks/useContratos"
import { TablePageLayout } from "@/components/ui/table-page-layout"
import { useUserRole } from "@/hooks/useUserRole"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormularioContrato } from "@/components/Contratos/FormularioContrato"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Contratos() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'suspenso' | 'expirado' | 'cancelado' | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { userRole, isAdmin, isFranqueado } = useUserRole()
  const { user } = useAuth()
  const [franquiaId, setFranquiaId] = useState<string | undefined>()

  // Para franqueados, buscar a franquia deles
  useEffect(() => {
    const fetchFranquia = async () => {
      if (!isFranqueado || !user?.id) return
      
      const { data } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .single()
      
      if (data) {
        setFranquiaId(data.id)
      }
    }

    if (isFranqueado) {
      fetchFranquia()
    }
  }, [isFranqueado, user?.id])
  
  const { data: contratos, isLoading } = useContratos({ 
    status: statusFilter,
    franquia_id: isAdmin ? undefined : franquiaId 
  })
  const { data: stats } = useContratoStats()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  }

  const getStatusBadge = (status: string, dataFim: string | null) => {
    if (status === 'cancelado') {
      return <Badge variant="destructive">Cancelado</Badge>
    }
    
    if (status === 'suspenso') {
      return <Badge variant="outline">Suspenso</Badge>
    }
    
    if (!dataFim) {
      return <Badge variant="default">Ativo</Badge>
    }
    
    const now = new Date()
    const fim = new Date(dataFim)
    const diasRestantes = Math.ceil((fim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasRestantes < 0) {
      return <Badge variant="destructive">Expirado</Badge>
    } else if (diasRestantes <= 30) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">A Vencer</Badge>
    }
    
    return <Badge variant="default">Ativo</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Contratos"
          value={stats?.total || 0}
          icon={FileText}
        />
        <StatCard
          title="Contratos Ativos"
          value={stats?.ativos || 0}
          icon={Calendar}
          variant="success"
        />
        <StatCard
          title="A Vencer (30 dias)"
          value={stats?.aVencer || 0}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Vencidos"
          value={stats?.vencidos || 0}
          icon={DollarSign}
          variant="destructive"
        />
      </div>

      {/* Formulário de Novo Contrato */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato de Serviço</DialogTitle>
          </DialogHeader>
          <FormularioContrato onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Tabela de Contratos */}
      <TablePageLayout
        title="Contratos de Serviço"
        description="Gerencie os contratos de serviço com produtores"
        actionButton={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        }
        filterSection={
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="suspenso">Suspensos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        tableContent={
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Franquia</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : contratos?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum contrato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                contratos?.map((contrato) => (
                  <TableRow 
                    key={contrato.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/contratos/${contrato.id}`)}
                  >
                    <TableCell className="font-medium">{contrato.numero_contrato}</TableCell>
                    <TableCell>{contrato.franquias?.nome}</TableCell>
                    <TableCell>{contrato.produtor?.nome}</TableCell>
                    <TableCell>{formatDate(contrato.data_inicio)}</TableCell>
                    <TableCell>{contrato.data_fim ? formatDate(contrato.data_fim) : '-'}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{getStatusBadge(contrato.status, contrato.data_fim)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/contratos/${contrato.id}`)
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        }
      />
    </div>
  )
}
