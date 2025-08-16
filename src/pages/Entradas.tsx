import { useState } from "react"
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Package,
  Upload,
  Eye,
  Edit,
  MoreHorizontal,
  FileText,
  Download,
  User,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    'aguardando_transporte': { label: 'Aguardando Transporte', variant: 'secondary' as const },
    'em_transferencia': { label: 'Em Transferência', variant: 'default' as const },
    'aguardando_conferencia': { label: 'Aguardando Conferência', variant: 'outline' as const },
    'conferencia_completa': { label: 'Conferência Completa', variant: 'default' as const },
    'confirmado': { label: 'Confirmado', variant: 'default' as const },
    'rejeitado': { label: 'Rejeitado', variant: 'destructive' as const },
    'processando': { label: 'Processando', variant: 'secondary' as const }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || 
    { label: status || 'Desconhecido', variant: 'secondary' as const }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/Entradas/FileUpload"
import { FormularioEntrada } from "@/components/Entradas/FormularioEntrada"
import { NFData } from "@/components/Entradas/NFParser"
import { useToast } from "@/hooks/use-toast"
import { useEntradas } from "@/hooks/useEntradas"
import { findProdutorByCpfCnpj } from "@/hooks/useProdutorByCpfCnpj"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"

export default function Entradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [nfData, setNfData] = useState<NFData | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [produtorIdentificado, setProdutorIdentificado] = useState<any>(null)
  const [produtorError, setProdutorError] = useState<string | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { data: entradas, isLoading, refetch } = useEntradas()
  const { user } = useAuth()
  const { data: currentUserProfile } = useProfile()

  const handleNFDataParsed = async (data: NFData) => {
    setNfData(data)
    setProdutorError(null)
    setProdutorIdentificado(null)

    // Verificar se a NFe já foi importada (validação mais robusta)
    let entradaExistente = null;
    
    // Primeira validação: por chave NFe
    if (data.chaveNFe) {
      const { data: entradaPorChave } = await supabase
        .from('entradas')
        .select('id, numero_nfe, serie, emitente_nome')
        .eq('chave_nfe', data.chaveNFe)
        .maybeSingle();

      if (entradaPorChave) {
        entradaExistente = entradaPorChave;
      }
    }
    
    // Segunda validação: por número + série + CNPJ do emitente
    if (!entradaExistente && data.numeroNF && data.serie && data.emitente.cnpj) {
      const { data: entradaPorDados } = await supabase
        .from('entradas')
        .select('id, numero_nfe, serie, emitente_nome')
        .eq('numero_nfe', data.numeroNF)
        .eq('serie', data.serie)
        .eq('emitente_cnpj', data.emitente.cnpj)
        .maybeSingle();

      if (entradaPorDados) {
        entradaExistente = entradaPorDados;
      }
    }

    if (entradaExistente) {
      toast({
        title: "NFe já importada",
        description: `A Nota Fiscal ${entradaExistente.numero_nfe}/${entradaExistente.serie} do emitente ${entradaExistente.emitente_nome || data.emitente.nome} já foi importada no sistema.`,
        variant: "destructive",
      });
      return;
    }

    // Verificar se a NFe pertence ao usuário (quando não for admin/franqueado)
    if (currentUserProfile?.role === 'produtor') {
      if (!data.destinatarioCpfCnpj) {
        toast({
          title: "NFe inválida",
          description: "A NFe não contém CPF/CNPJ do destinatário",
          variant: "destructive",
        });
        return;
      }

      if (currentUserProfile.cpf_cnpj !== data.destinatarioCpfCnpj) {
        toast({
          title: "NFe não autorizada",
          description: "Esta NFe não pertence ao seu CPF/CNPJ cadastrado",
          variant: "destructive",
        });
        return;
      }
    }

    // Se admin/franqueado está fazendo upload, tentar identificar o produtor
    if (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'franqueado') {
      if (data.destinatarioCpfCnpj) {
        try {
          const produtor = await findProdutorByCpfCnpj(data.destinatarioCpfCnpj)
          
          if (produtor) {
            setProdutorIdentificado(produtor)
            toast({
              title: "Produtor identificado",
              description: `A entrada será registrada para ${produtor.nome}`,
            })
          } else {
            setProdutorError(`Nenhum produtor encontrado com CPF/CNPJ: ${data.destinatarioCpfCnpj}`)
            toast({
              title: "Produtor não encontrado",
              description: `Nenhum produtor cadastrado com o CPF/CNPJ ${data.destinatarioCpfCnpj}`,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error('Erro ao buscar produtor:', error)
          setProdutorError('Erro ao buscar produtor no sistema')
          toast({
            title: "Erro",
            description: "Erro ao buscar produtor no sistema",
            variant: "destructive",
          })
        }
      } else {
        setProdutorError('NFe não contém CPF/CNPJ do destinatário')
        toast({
          title: "Dados incompletos",
          description: "A NFe não contém CPF/CNPJ do destinatário",
          variant: "destructive",
        })
      }
    }

    setActiveTab("formulario")
    toast({
      title: "NFe processada com sucesso",
      description: `Nota fiscal ${data.numeroNF}/${data.serie} importada com ${data.itens.length} itens.`,
    })
  }

  const handleUploadError = (message: string) => {
    toast({
      title: "Erro no upload",
      description: message,
      variant: "destructive",
    })
  }

  const handleFormSubmit = async (dados: any) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      })
      return
    }

    // Determinar o user_id correto para a entrada
    let entradaUserId = user.id
    if (produtorIdentificado && (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'franqueado')) {
      entradaUserId = produtorIdentificado.user_id
    }

    try {
      let fornecedorId = null;
      
      // Se temos dados do emitente da NFe, criar/encontrar o fornecedor
      if (nfData?.emitente) {
        const { data: fornecedorExistente } = await supabase
          .from('fornecedores')
          .select('id')
          .eq('cnpj_cpf', nfData.emitente.cnpj)
          .single();

        if (fornecedorExistente) {
          fornecedorId = fornecedorExistente.id;
        } else {
          // Criar novo fornecedor - usar o user_id da entrada (produtor ou admin)
          const { data: novoFornecedor, error: fornecedorError } = await supabase
            .from('fornecedores')
            .insert({
              user_id: entradaUserId,
              nome: nfData.emitente.nome,
              nome_fantasia: nfData.emitente.nomeFantasia,
              cnpj_cpf: nfData.emitente.cnpj,
              endereco: nfData.emitente.endereco,
              ativo: true
            })
            .select()
            .single();

          if (fornecedorError) throw fornecedorError;
          fornecedorId = novoFornecedor.id;
        }
      }

      // Verificar duplicatas de NFe (validação mais robusta)
      let entradaExistente = null;
      
      // Primeira validação: por chave NFe
      if (dados.chaveNFe) {
        const { data: entradaPorChave } = await supabase
          .from('entradas')
          .select('id, numero_nfe, serie, emitente_nome')
          .eq('chave_nfe', dados.chaveNFe)
          .maybeSingle();

        if (entradaPorChave) {
          entradaExistente = entradaPorChave;
        }
      }
      
      // Segunda validação: por número + série + CNPJ do emitente
      if (!entradaExistente && dados.numeroNF && dados.serie && nfData?.emitente?.cnpj) {
        const { data: entradaPorDados } = await supabase
          .from('entradas')
          .select('id, numero_nfe, serie, emitente_nome')
          .eq('numero_nfe', dados.numeroNF)
          .eq('serie', dados.serie)
          .eq('emitente_cnpj', nfData.emitente.cnpj)
          .maybeSingle();

        if (entradaPorDados) {
          entradaExistente = entradaPorDados;
        }
      }

      if (entradaExistente) {
        toast({
          title: "NFe já importada",
          description: `A Nota Fiscal ${entradaExistente.numero_nfe}/${entradaExistente.serie} do emitente ${entradaExistente.emitente_nome || nfData?.emitente?.nome || 'N/A'} já foi importada no sistema.`,
          variant: "destructive",
        });
        return;
      }

      console.log('Dados da entrada a serem salvos:', {
        user_id: entradaUserId,
        produtor_identificado: produtorIdentificado?.nome,
        numeroNF: dados.numeroNF,
        serie: dados.serie,
        chaveNFe: dados.chaveNFe,
        destinatario_cpf_cnpj: nfData?.destinatarioCpfCnpj
      });

      // Criar a entrada
      const { data: entrada, error: entradaError } = await supabase
        .from('entradas')
        .insert({
          user_id: entradaUserId, // Usar o user_id do produtor identificado
          numero_nfe: dados.numeroNF || null,
          serie: dados.serie || null,
          chave_nfe: dados.chaveNFe || null,
          natureza_operacao: dados.naturezaOperacao || null,
          data_entrada: dados.dataEntrada,
          data_emissao: dados.dataEmissao || dados.dataEntrada,
          valor_total: dados.valorTotal,
          deposito_id: dados.depositoId || null,
          fornecedor_id: fornecedorId,
          observacoes: dados.observacoes,
          status: 'aguardando_transporte',
          status_aprovacao: 'aguardando_transporte',
          xml_content: dados.tipo === 'nfe' ? dados.xmlContent || 'XML importado' : null,
          emitente_nome: nfData?.emitente?.nome || null,
          emitente_cnpj: nfData?.emitente?.cnpj || null,
          emitente_endereco: nfData?.emitente?.endereco || null,
          destinatario_cpf_cnpj: nfData?.destinatarioCpfCnpj || null
        })
        .select()
        .single()

      if (entradaError) throw entradaError

      // Criar os itens da entrada
      if (dados.itens && dados.itens.length > 0) {
        const itensEntrada = dados.itens.map((item: any) => ({
          user_id: entradaUserId, // Usar o mesmo user_id da entrada
          entrada_id: entrada.id,
          produto_id: null, // Por enquanto nulo, depois pode implementar busca/criação de produtos
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          valor_total: item.valorTotal,
          lote: item.lote,
          nome_produto: item.produto, // Adicionar o nome correto do produto
          data_validade: item.dataValidade || null, // Adicionar data de validade se disponível
          quantidade_lote: item.quantidadeLote || null, // Adicionar quantidade do lote
          data_fabricacao: item.dataFabricacao || null // Adicionar data de fabricação
        }))

        const { error: itensError } = await supabase
          .from('entrada_itens')
          .insert(itensEntrada)

        if (itensError) throw itensError
      }

      const successMessage = produtorIdentificado 
        ? `Entrada registrada para o produtor ${produtorIdentificado.nome}`
        : "A entrada foi registrada com sucesso no sistema."

      toast({
        title: "Entrada registrada",
        description: successMessage,
      })
      
      setIsNewEntryOpen(false)
      setNfData(null)
      setProdutorIdentificado(null)
      setProdutorError(null)
      setActiveTab("upload")
      refetch() // Recarregar a lista de entradas
    } catch (error) {
      console.error('Erro ao registrar entrada:', error)
      toast({
        title: "Erro ao registrar entrada",
        description: "Ocorreu um erro ao salvar a entrada no sistema.",
        variant: "destructive",
      })
    }
  }

  const handleFormCancel = () => {
    setIsNewEntryOpen(false)
    setNfData(null)
    setProdutorIdentificado(null)
    setProdutorError(null)
    setActiveTab("upload")
  }

  const handleNovaEntradaManual = () => {
    setNfData(null)
    setProdutorIdentificado(null)
    setProdutorError(null)
    setActiveTab("formulario")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-muted-foreground">
            Gerencie e registre as entradas de produtos no estoque
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setIsNewEntryOpen(true)
              setActiveTab("upload")
            }}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar XML
          </Button>
          <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Registrar Nova Entrada</DialogTitle>
                <DialogDescription>
                  Importe uma NFe ou preencha os dados manualmente
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload NFe
                  </TabsTrigger>
                  <TabsTrigger value="formulario" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Formulário
                  </TabsTrigger>
                  <TabsTrigger value="manual" onClick={handleNovaEntradaManual} className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Manual
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-6">
                  <FileUpload 
                    onNFDataParsed={handleNFDataParsed}
                    onError={handleUploadError}
                  />
                  
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={handleNovaEntradaManual}>
                      Ou preencher manualmente
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="formulario" className="mt-6">
                  {/* Status do Produtor Identificado */}
                  {(produtorIdentificado || produtorError) && (
                    <div className="mb-6">
                      {produtorIdentificado && (
                        <Alert className="border-green-200 bg-green-50">
                          <User className="w-4 h-4 text-green-600" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <strong>Produtor identificado:</strong> {produtorIdentificado.nome}
                                <br />
                                <span className="text-sm text-muted-foreground">
                                  CPF/CNPJ: {produtorIdentificado.cpf_cnpj} | Email: {produtorIdentificado.email}
                                </span>
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Auto-identificado
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {produtorError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            <strong>Atenção:</strong> {produtorError}
                            <br />
                            <span className="text-sm">
                              Verifique se o produtor está cadastrado no sistema ou preencha manualmente.
                            </span>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  <FormularioEntrada
                    nfData={nfData}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </TabsContent>

                <TabsContent value="manual" className="mt-6">
                  <FormularioEntrada
                    nfData={null}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                  />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, lote ou origem..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Período
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entradas Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Entradas</CardTitle>
          <CardDescription>
            {entradas?.length || 0} entradas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : entradas && entradas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px]">Número NFe</TableHead>
                    <TableHead className="min-w-[60px]">Série</TableHead>
                    <TableHead className="min-w-[120px]">Chave NFe</TableHead>
                    <TableHead className="min-w-[120px]">Emitente</TableHead>
                    <TableHead className="min-w-[100px]">CNPJ/CPF</TableHead>
                    <TableHead className="min-w-[80px]">Data Emissão</TableHead>
                    <TableHead className="min-w-[80px]">Data Entrada</TableHead>
                    <TableHead className="min-w-[100px]">Nat. Operação</TableHead>
                    <TableHead className="min-w-[80px]">Itens</TableHead>
                    <TableHead className="min-w-[80px]">Depósito</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Valor Total</TableHead>
                    <TableHead className="min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entradas.map((entrada) => (
                    <TableRow key={entrada.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {entrada.numero_nfe || `ENT-${entrada.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {entrada.serie || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs font-mono">
                          {entrada.chave_nfe ? entrada.chave_nfe.substring(0, 16) + '...' : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          <span className="text-sm font-medium truncate block">
                            {(entrada as any).emitente_nome || entrada.fornecedores?.nome || 'N/A'}
                          </span>
                          {(entrada.fornecedores as any)?.nome_fantasia && (
                            <span className="text-xs text-muted-foreground truncate block">
                              {(entrada.fornecedores as any).nome_fantasia}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {(entrada as any).emitente_cnpj || (entrada.fornecedores as any)?.cnpj_cpf || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {entrada.data_emissao 
                            ? new Date(entrada.data_emissao).toLocaleDateString('pt-BR')
                            : 'N/A'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(entrada.data_entrada).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[120px]">
                          <span className="text-xs text-muted-foreground truncate block">
                            {entrada.natureza_operacao || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm">
                            {entrada.entrada_itens?.length || 0} itens
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {(entrada as any).franquias?.nome || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={entrada.status_aprovacao || entrada.status} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {entrada.valor_total 
                          ? `R$ ${entrada.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {entrada.xml_content && (
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download XML
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<Package className="w-8 h-8 text-muted-foreground" />}
              title="Nenhuma entrada registrada"
              description="Registre sua primeira entrada importando uma NFe ou preenchendo o formulário manual."
              action={{
                label: "Registrar Primeira Entrada",
                onClick: () => setIsNewEntryOpen(true)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}