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
  AlertTriangle,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ColumnVisibilityControl, type ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
import { useQueryClient } from "@tanstack/react-query"
import { findFornecedorByCnpj, findProdutorByCpfCnpj } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useProfile } from "@/hooks/useProfile"
import { useUserRole } from "@/hooks/useUserRole"
import { DateRangeFilter, DateRange } from "@/components/ui/date-range-filter"
import { format } from "date-fns"

export default function Entradas() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [nfData, setNfData] = useState<NFData | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [produtorIdentificado, setProdutorIdentificado] = useState<any>(null)
  const [produtorError, setProdutorError] = useState<string | null>(null)
  const [selectedEntrada, setSelectedEntrada] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: entradas, isLoading } = useEntradas(dateRange)
  const { user } = useAuth()
  const { data: currentUserProfile } = useProfile()
  const { isAdmin, isFranqueado } = useUserRole()

  // Column visibility state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    // Basic Info
    { key: "numero_nfe", label: "NFe", visible: true, category: "Básico" },
    { key: "serie", label: "Série", visible: true, category: "Básico" },
    { key: "chave_nfe", label: "Chave", visible: false, category: "Básico" },
    { key: "emitente_nome", label: "Emitente", visible: true, category: "Básico" },
    { key: "emitente_cnpj", label: "CNPJ/CPF", visible: false, category: "Básico" },
    { key: "data_emissao", label: "Data", visible: true, category: "Básico" },
    { key: "data_entrada", label: "Entrada", visible: false, category: "Básico" },
    { key: "natureza_operacao", label: "Operação", visible: false, category: "Básico" },
    { key: "itens_count", label: "Itens", visible: true, category: "Básico" },
    { key: "deposito_nome", label: "Depósito", visible: false, category: "Básico" },
    { key: "status_aprovacao", label: "Status", visible: true, category: "Básico" },
    { key: "valor_total", label: "Valor", visible: true, category: "Básico" },
    { key: "actions", label: "Ações", visible: true, category: "Básico" },
    
    // Emitente
    { key: "emitente_nome_fantasia", label: "Nome Fantasia", visible: false, category: "Emitente" },
    { key: "emitente_ie", label: "IE", visible: false, category: "Emitente" },
    { key: "emitente_endereco", label: "Endereço", visible: false, category: "Emitente" },
    { key: "emitente_municipio", label: "Município", visible: false, category: "Emitente" },
    { key: "emitente_uf", label: "UF", visible: false, category: "Emitente" },
    { key: "emitente_cep", label: "CEP", visible: false, category: "Emitente" },
    { key: "emitente_telefone", label: "Telefone", visible: false, category: "Emitente" },
    
    // Destinatário
    { key: "destinatario_nome", label: "Nome", visible: false, category: "Destinatário" },
    { key: "destinatario_cpf_cnpj", label: "CPF/CNPJ", visible: false, category: "Destinatário" },
    { key: "destinatario_ie", label: "IE", visible: false, category: "Destinatário" },
    { key: "destinatario_endereco", label: "Endereço", visible: false, category: "Destinatário" },
    { key: "destinatario_municipio", label: "Município", visible: false, category: "Destinatário" },
    { key: "destinatario_uf", label: "UF", visible: false, category: "Destinatário" },
    { key: "destinatario_cep", label: "CEP", visible: false, category: "Destinatário" },
    
    // Transporte
    { key: "modalidade_frete", label: "Modalidade Frete", visible: false, category: "Transporte" },
    { key: "transportadora_nome", label: "Transportadora", visible: false, category: "Transporte" },
    { key: "transportadora_cnpj", label: "CNPJ Transp.", visible: false, category: "Transporte" },
    { key: "veiculo_placa", label: "Placa", visible: false, category: "Transporte" },
    { key: "veiculo_uf", label: "UF Veículo", visible: false, category: "Transporte" },
    
    // Valores
    { key: "valor_produtos", label: "Valor Produtos", visible: false, category: "Valores" },
    { key: "valor_frete", label: "Valor Frete", visible: false, category: "Valores" },
    { key: "valor_seguro", label: "Valor Seguro", visible: false, category: "Valores" },
    { key: "valor_desconto", label: "Valor Desconto", visible: false, category: "Valores" },
    { key: "valor_icms", label: "ICMS", visible: false, category: "Valores" },
    { key: "valor_ipi", label: "IPI", visible: false, category: "Valores" },
    { key: "valor_pis", label: "PIS", visible: false, category: "Valores" },
    { key: "valor_cofins", label: "COFINS", visible: false, category: "Valores" },
    { key: "valor_total_tributos", label: "Total Tributos", visible: false, category: "Valores" },
    
    // Pesos/Volumes
    { key: "quantidade_volumes", label: "Qtd. Volumes", visible: false, category: "Pesos/Volumes" },
    { key: "peso_bruto", label: "Peso Bruto", visible: false, category: "Pesos/Volumes" },
    { key: "peso_liquido", label: "Peso Líquido", visible: false, category: "Pesos/Volumes" },
    
    // Datas
    { key: "dh_emissao", label: "DH Emissão", visible: false, category: "Datas" },
    { key: "dh_saida_entrada", label: "DH Saída/Entrada", visible: false, category: "Datas" },
    { key: "data_recebimento", label: "Data Recebimento", visible: false, category: "Datas" },
    { key: "data_aprovacao", label: "Data Aprovação", visible: false, category: "Datas" },
    
    // Sistema
    { key: "created_at", label: "Criado em", visible: false, category: "Sistema" },
    { key: "updated_at", label: "Atualizado em", visible: false, category: "Sistema" },
    { key: "observacoes", label: "Observações", visible: false, category: "Sistema" },
    { key: "observacoes_franqueado", label: "Obs. Franqueado", visible: false, category: "Sistema" },
  ])

  const handleNFDataParsed = async (data: NFData) => {
    setNfData(data)
    setProdutorError(null)
    setProdutorIdentificado(null)

    // Verificar se a NFe já foi importada (validação mais robusta)
    let entradaExistente = null;
    
    // Buscar por chave da NFe primeiro (mais preciso)
    if (data.chaveNFe) {
      const { data: entradaByChave } = await supabase
        .from('entradas')
        .select('*')
        .eq('chave_nfe', data.chaveNFe)
        .maybeSingle();
      
      if (entradaByChave) entradaExistente = entradaByChave;
    }
    
    // Se não encontrou pela chave, buscar por combinação de campos
    if (!entradaExistente && data.numeroNF && data.serie && data.emitente?.cnpj) {
      const { data: entradaByCombo } = await supabase
        .from('entradas')
        .select('*')
        .eq('numero_nfe', data.numeroNF)
        .eq('serie', data.serie)
        .eq('emitente_cnpj', data.emitente.cnpj)
        .maybeSingle();
        
      if (entradaByCombo) entradaExistente = entradaByCombo;
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

      // Buscar o produtor pelo CPF/CNPJ do destinatário
      try {
        const produtorByCpf = await findProdutorByCpfCnpj(supabase, data.destinatarioCpfCnpj)
        if (produtorByCpf) {
          setProdutorIdentificado(produtorByCpf)
          // Verificar se o produtor identificado é o usuário atual
          if (produtorByCpf.user_id !== user?.id) {
            setProdutorError('Você só pode importar NFes onde você é o destinatário')
            toast({
              title: "NFe não permitida",
              description: "Você só pode importar NFes onde você é o destinatário.",
              variant: "destructive",
            })
            return
          }
        } else {
          setProdutorError('Nenhum produtor encontrado para o CPF/CNPJ do destinatário')
          toast({
            title: "NFe rejeitada",
            description: "NFe rejeitada: nenhum usuário produtor encontrado para o CPF/CNPJ do destinatário.",
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        setProdutorError('Erro ao buscar produtor no sistema')
        toast({
          title: "Erro",
          description: "Erro ao buscar produtor no sistema",
          variant: "destructive",
        })
        return
      }
    } else {
      // Para admin e franqueado, buscar o produtor se tiver destinatário
      if (data.destinatario?.cpfCnpj) {
        try {
          const produtorByCpf = await findProdutorByCpfCnpj(supabase, data.destinatario.cpfCnpj)
          if (produtorByCpf) {
            setProdutorIdentificado(produtorByCpf)
          } else {
            setProdutorError('Nenhum produtor encontrado para o CPF/CNPJ do destinatário')
            toast({
              title: "NFe rejeitada",
              description: "NFe rejeitada: nenhum usuário produtor encontrado para o CPF/CNPJ do destinatário.",
              variant: "destructive",
            })
            return
          }
        } catch (error) {
          setProdutorError('Erro ao buscar produtor no sistema')
          toast({
            title: "Erro",
            description: "Erro ao buscar produtor no sistema",
            variant: "destructive",
          })
          return
        }
      } else {
        setProdutorError('NFe não contém CPF/CNPJ do destinatário')
        toast({
          title: "NFe rejeitada",
          description: "NFe rejeitada: não contém CPF/CNPJ do destinatário.",
          variant: "destructive",
        })
        return
      }
    }

    setActiveTab("manual")
  }

  const handleEntradaSubmit = async (entradaData: any) => {
    if (!user?.id) {
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
      if (nfData?.emitente?.cnpj) {
        const fornecedorExistente = await findFornecedorByCnpj(supabase, nfData.emitente.cnpj, entradaUserId);

        if (fornecedorExistente) {
          fornecedorId = fornecedorExistente.id;
        } else {
          // Criar novo fornecedor - usar o user_id da entrada (produtor ou admin)
          // Salvar CNPJ sempre sem máscara para consistência
          const cnpjLimpo = nfData.emitente.cnpj.replace(/[^\d]/g, '');
          const { data: novoFornecedor, error: fornecedorError } = await supabase
            .from('fornecedores')
            .insert({
              user_id: entradaUserId,
              nome: nfData.emitente.nome,
              nome_fantasia: nfData.emitente.nomeFantasia,
              cnpj_cpf: cnpjLimpo,
              endereco: nfData.emitente.endereco,
              ativo: true
            })
            .select()
            .single();

          if (fornecedorError) throw fornecedorError;
          fornecedorId = novoFornecedor.id;
        }
      }

      // Preparar dados da entrada com informações da NFe se disponível
      const dadosEntrada = {
        ...entradaData,
        user_id: entradaUserId,
        fornecedor_id: fornecedorId,
        
        // Dados da NFe se disponível
        ...(nfData && {
          numero_nfe: nfData.numeroNF,
          serie: nfData.serie,
          chave_nfe: nfData.chaveNFe,
          data_emissao: nfData.dataEmissao,
          dh_emissao: nfData.dhEmissao,
          dh_saida_entrada: nfData.dhSaidaEntrada,
          natureza_operacao: nfData.naturezaOperacao,
          valor_total: nfData.valorTotal,
          xml_content: nfData.xmlContent,
          
          // Emitente
          emitente_nome: nfData.emitente?.nome,
          emitente_nome_fantasia: nfData.emitente?.nomeFantasia,
          emitente_cnpj: nfData.emitente?.cnpj,
          emitente_ie: nfData.emitente?.ie,
          emitente_endereco: nfData.emitente?.endereco,
          emitente_municipio: nfData.emitente?.municipio,
          emitente_uf: nfData.emitente?.uf,
          emitente_cep: nfData.emitente?.cep,
          emitente_telefone: nfData.emitente?.telefone,
          
          // Destinatário
          destinatario_nome: nfData.destinatario?.nome,
          destinatario_cpf_cnpj: nfData.destinatario?.cpfCnpj,
          destinatario_ie: nfData.destinatario?.ie,
          destinatario_endereco: nfData.destinatario?.endereco,
          destinatario_municipio: nfData.destinatario?.municipio,
          destinatario_uf: nfData.destinatario?.uf,
          destinatario_cep: nfData.destinatario?.cep,
          
          // Transporte
          modalidade_frete: nfData.transporte?.modalidadeFrete,
          transportadora_nome: nfData.transporte?.transportadora?.nome,
          transportadora_cnpj: nfData.transporte?.transportadora?.cnpj,
          veiculo_placa: nfData.transporte?.veiculo?.placa,
          veiculo_uf: nfData.transporte?.veiculo?.uf,
          
          // Valores detalhados
          valor_produtos: nfData.valores?.produtos,
          valor_frete: nfData.valores?.frete,
          valor_seguro: nfData.valores?.seguro,
          valor_desconto: nfData.valores?.desconto,
          valor_icms: nfData.valores?.icms,
          valor_ipi: nfData.valores?.ipi,
          valor_pis: nfData.valores?.pis,
          valor_cofins: nfData.valores?.cofins,
          valor_total_tributos: nfData.valores?.totalTributos,
          
          // Volumes e pesos
          quantidade_volumes: nfData.volumes?.quantidade,
          peso_bruto: nfData.volumes?.pesoBruto,
          peso_liquido: nfData.volumes?.pesoLiquido,
        })
      }

      // Verificar duplicatas de NFe (validação mais robusta)
      let entradaExistente = null;
      
      // Primeira validação: por chave NFe
      if (dadosEntrada.chave_nfe) {
        const { data: entradaPorChave } = await supabase
          .from('entradas')
          .select('id, numero_nfe, serie, emitente_nome')
          .eq('chave_nfe', dadosEntrada.chave_nfe)
          .maybeSingle();

        if (entradaPorChave) {
          entradaExistente = entradaPorChave;
        }
      }
      
      // Segunda validação: por número + série + CNPJ do emitente
      if (!entradaExistente && dadosEntrada.numero_nfe && dadosEntrada.serie && dadosEntrada.emitente_cnpj) {
        const { data: entradaPorDados } = await supabase
          .from('entradas')
          .select('id, numero_nfe, serie, emitente_nome')
          .eq('numero_nfe', dadosEntrada.numero_nfe)
          .eq('serie', dadosEntrada.serie)
          .eq('emitente_cnpj', dadosEntrada.emitente_cnpj)
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

      const { data: entrada, error } = await supabase
        .from('entradas')
        .insert(dadosEntrada)
        .select()
        .single()

      if (error) throw error

      // Se temos itens da NFe, inserir entrada_itens
      if (nfData?.itens && entrada.id) {
        const itensParaInserir = nfData.itens.map((item: any) => ({
          entrada_id: entrada.id,
          user_id: entradaUserId,
          codigo_produto: item.codigo,
          nome_produto: item.descricao,
          descricao_produto: item.descricao,
          quantidade: parseFloat(item.quantidade || '0'),
          valor_unitario: parseFloat(item.valorUnitario || '0'),
          valor_total: parseFloat(item.valorTotal || '0'),
          unidade_comercial: item.unidade,
          cfop: item.cfop,
          ncm: item.ncm,
          cest: item.cest,
          codigo_ean: item.ean,
          lote: item.lote,
          data_validade: item.dataValidade,
          data_fabricacao: item.dataFabricacao,
          
          // Campos tributários
          quantidade_comercial: parseFloat(item.quantidadeComercial || item.quantidade || '0'),
          valor_unitario_comercial: parseFloat(item.valorUnitarioComercial || item.valorUnitario || '0'),
          unidade_tributavel: item.unidadeTributavel || item.unidade,
          quantidade_tributavel: parseFloat(item.quantidadeTributavel || item.quantidade || '0'),
          valor_unitario_tributavel: parseFloat(item.valorUnitarioTributavel || item.valorUnitario || '0'),
          codigo_ean_tributavel: item.eanTributavel || item.ean,
          indicador_total: item.indicadorTotal,
          valor_total_tributos_item: parseFloat(item.valorTotalTributosItem || '0'),
          
          // Impostos ICMS
          impostos_icms: item.impostos?.icms ? JSON.stringify(item.impostos.icms) : null,
          impostos_ipi: item.impostos?.ipi ? JSON.stringify(item.impostos.ipi) : null,
          impostos_pis: item.impostos?.pis ? JSON.stringify(item.impostos.pis) : null,
          impostos_cofins: item.impostos?.cofins ? JSON.stringify(item.impostos.cofins) : null,
          
          // Dados logísticos (se presentes)
          volumes: parseFloat(item.volumes || '0'),
          pallets: parseFloat(item.pallets || '0'),
          volumes_por_pallet: parseFloat(item.volumesPorPallet || '0'),
          quantidade_lote: parseFloat(item.quantidadeLote || '0')
        }))

        const { error: itensError } = await supabase
          .from('entrada_itens')
          .insert(itensParaInserir)

        if (itensError) {
          toast({
            title: "Aviso",
            description: "Entrada criada, mas houve erro ao inserir alguns itens: " + itensError.message,
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Sucesso",
        description: "Entrada registrada com sucesso!",
      })

      // Limpar estados e fechar diálogos
      setIsNewEntryOpen(false)
      setNfData(null)
      setProdutorIdentificado(null)
      setProdutorError(null)
      setActiveTab("upload")
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["entradas"] })

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrada: " + (error.message || "Erro desconhecido"),
        variant: "destructive",
      })
    }
  }

  const handleNovaEntradaManual = () => {
    setNfData(null)
    setProdutorIdentificado(null)
    setProdutorError(null)
    setActiveTab("manual")
  }

  const handleDeleteEntrada = async (entradaId: string, numeroNfe?: string) => {
    try {
      // Verificar se a entrada existe antes de deletar
      const { data: entradaExists, error: checkError } = await supabase
        .from('entradas')
        .select('id, user_id')
        .eq('id', entradaId)
        .single()
      
      if (checkError) {
        throw new Error(`Entrada não encontrada: ${checkError.message}`)
      }
      
      // Verificar permissões do usuário atual
      const { data: currentUser } = await supabase.auth.getUser()
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', currentUser.user?.id)
        .single()

      // 1. Deletar entrada_status_historico primeiro
      const { error: historicoDeleteError } = await supabase
        .from('entrada_status_historico')
        .delete()
        .eq('entrada_id', entradaId)

      if (historicoDeleteError) {
        throw new Error(`Erro ao deletar histórico: ${historicoDeleteError.message}`)
      }

      // 2. Buscar entrada_itens
      const { data: entradaItens, error: fetchItensError } = await supabase
        .from('entrada_itens')
        .select('id, produto_id')
        .eq('entrada_id', entradaId)

      if (fetchItensError) {
        throw new Error(`Erro ao buscar itens: ${fetchItensError.message}`)
      }

      // 3. Buscar e remover alocações de pallets se houver
      const { data: entradaPallets } = await supabase
        .from('entrada_pallets')
        .select('id')
        .eq('entrada_id', entradaId);
        
      if (entradaPallets && entradaPallets.length > 0) {
        const palletIds = entradaPallets.map(pallet => pallet.id)
        
        const { error: palletPositionsError } = await supabase
          .from('pallet_positions')
          .update({ status: 'removido' })
          .in('pallet_id', palletIds)

        if (palletPositionsError) {
          throw new Error(`Erro ao remover alocações: ${palletPositionsError.message}`)
        }
      }

      // 4. Deletar movimentacoes relacionadas
      const { error: movimentacoesError } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('referencia_id', entradaId)
        .eq('referencia_tipo', 'entrada')

      if (movimentacoesError) {
        throw new Error(`Erro ao deletar movimentações: ${movimentacoesError.message}`)
      }

      // 5. Deletar entrada_itens
      const { error: itensDeleteError } = await supabase
        .from('entrada_itens')
        .delete()
        .eq('entrada_id', entradaId)

      if (itensDeleteError) {
        throw new Error(`Erro ao deletar itens: ${itensDeleteError.message}`)
      }

      // 6. FINALMENTE, deletar a entrada - FORÇAR DELEÇÃO DIRETA
      // Verificar se é admin, franqueado ou dono da entrada
      const isOwner = entradaExists.user_id === currentUser.user?.id
      const isAdmin = userProfile?.role === 'admin'
      const isFranqueado = userProfile?.role === 'franqueado'
      
      if (!isOwner && !isAdmin && !isFranqueado) {
        throw new Error('Você não tem permissão para deletar esta entrada')
      }
      
      const { data: deletedEntrada, error: entradaDeleteError } = await supabase
        .from('entradas')
        .delete()
        .eq('id', entradaId)

      if (entradaDeleteError) {
        throw new Error(`ERRO ao deletar entrada: ${entradaDeleteError.message}`)
      }

      if (!deletedEntrada || deletedEntrada.length === 0) {
        throw new Error('Nenhuma entrada foi deletada. As políticas de segurança impediram a operação.')
      }

      toast({
        title: "Entrada deletada",
        description: `A entrada ${numeroNfe || `ENT-${entradaId.slice(0, 8)}`} e todos os dados relacionados foram removidos com sucesso.`,
      })

      // Invalidate queries to refresh the list efficiently
      queryClient.invalidateQueries({ queryKey: ["entradas"] })
      queryClient.invalidateQueries({ queryKey: ["estoque"] })
    } catch (error: any) {
      toast({
        title: "Erro ao deletar entrada",
        description: error.message || "Ocorreu um erro ao deletar a entrada e seus dados relacionados.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Entradas</h1>
              <p className="text-muted-foreground">
                Gerencie e registre as entradas de produtos no estoque
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <DateRangeFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              <ColumnVisibilityControl
                columns={columns}
                onVisibilityChange={(columnKey, visible) => {
                  setColumns(prev => prev.map(col => 
                    col.key === columnKey ? { ...col, visible } : col
                  ))
                }}
                onResetDefault={() => {
                  setColumns(prev => prev.map(col => ({
                    ...col,
                    visible: ["numero_nfe", "serie", "emitente_nome", "data_emissao", "itens_count", "status_aprovacao", "valor_total", "actions"].includes(col.key)
                  })))
                }}
              />
              <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Entrada</DialogTitle>
                    <DialogDescription>
                      Importe uma NFe ou preencha os dados manualmente
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Importar NFe</TabsTrigger>
                      <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-4">
                      <FileUpload onNFDataParsed={handleNFDataParsed} onError={() => {}} />
                      
                      {produtorError && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{produtorError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {produtorIdentificado && (
                        <Alert>
                          <User className="h-4 w-4" />
                          <AlertDescription>
                            NFe será registrada para: <strong>{produtorIdentificado.nome}</strong>
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="manual" className="space-y-4">
                      <FormularioEntrada 
                        onSubmit={handleEntradaSubmit}
                        nfData={nfData}
                        onNovaEntradaManual={handleNovaEntradaManual}
                      />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Entradas Table - Scrollable area */}
      <div className="flex-1 overflow-hidden p-6">
        <Card className="shadow-card h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Lista de Entradas</CardTitle>
            <CardDescription>
              {entradas?.length || 0} entradas registradas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : entradas && entradas.length > 0 ? (
              <div className="h-full overflow-y-auto">
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 bg-background border-b z-10">
                    <TableRow>
                      {columns.filter(col => col.visible).map((column) => (
                        <TableHead key={column.key} className="w-20 text-xs lg:text-sm">
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entradas.map((entrada) => (
                      <TableRow key={entrada.id} className="hover:bg-muted/50">
                        {columns.filter(col => col.visible).map((column) => {
                          const getCellContent = () => {
                            switch (column.key) {
                              case "numero_nfe":
                                return entrada.numero_nfe || "N/A"
                              case "serie":
                                return entrada.serie || "N/A"
                              case "chave_nfe":
                                return entrada.chave_nfe ? entrada.chave_nfe.substring(0, 8) + "..." : "N/A"
                              case "emitente_nome":
                                return entrada.emitente_nome || entrada.fornecedores?.nome || "N/A"
                              case "emitente_cnpj":
                                return entrada.emitente_cnpj || "N/A"
                              case "data_emissao":
                                return entrada.data_emissao 
                                  ? format(new Date(entrada.data_emissao), "dd/MM/yyyy") 
                                  : entrada.data_entrada 
                                    ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") 
                                    : "N/A"
                              case "data_entrada":
                                return entrada.data_entrada 
                                  ? format(new Date(entrada.data_entrada), "dd/MM/yyyy") 
                                  : "N/A"
                              case "natureza_operacao":
                                return entrada.natureza_operacao || "N/A"
                              case "itens_count":
                                return entrada.entrada_itens?.length || 0
                              case "deposito_nome":
                                return entrada.franquias?.nome || "N/A"
                              case "status_aprovacao":
                                return <StatusBadge status={entrada.status_aprovacao || 'aguardando_transporte'} />
                              case "valor_total":
                                return entrada.valor_total 
                                  ? `R$ ${Number(entrada.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                                  : "N/A"
                              case "actions":
                                return (
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedEntrada(entrada)
                                        setIsEditMode(true)
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    {(isAdmin || isFranqueado) && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                            <MoreHorizontal className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => {
                                            setSelectedEntrada(entrada)
                                            setIsEditMode(true)
                                          }}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            if (confirm('Tem certeza que deseja excluir esta entrada?')) {
                                              handleDeleteEntrada(entrada.id)
                                            }
                                          }}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                )
                              default:
                                return entrada[column.key as keyof typeof entrada] || "N/A"
                            }
                          }

                          const content = getCellContent()
                          const isAction = column.key === "actions" || column.key === "status_aprovacao"
                          
                          return (
                            <TableCell key={column.key} className="text-xs lg:text-sm">
                              {isAction ? content : (
                                <span 
                                  className="truncate block" 
                                  title={typeof content === 'string' ? content : ''}
                                >
                                  {content}
                                </span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <EmptyState
                  icon={<Package className="w-8 h-8 text-muted-foreground" />}
                  title="Nenhuma entrada registrada"
                  description="Registre sua primeira entrada importando uma NFe ou preenchendo o formulário manual."
                  action={{
                    label: "Registrar Primeira Entrada",
                    onClick: () => setIsNewEntryOpen(true)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
