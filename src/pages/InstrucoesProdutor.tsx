import { TableOfContents, InstructionSection } from '@/components/Instrucoes/TableOfContents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Truck, Package, Send, MapPin, FileText, Tractor } from 'lucide-react'

const produtorSections: InstructionSection[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    description: 'Como começar a usar a plataforma AgroHub',
    content: (
      <div className="space-y-6">
        <p className="text-lg">Bem-vindo ao AgroHub! Esta plataforma foi desenvolvida para facilitar o gerenciamento da sua produção e logística.</p>
        
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <Tractor className="h-5 w-5" />
            O que você pode fazer
          </h4>
          <ul className="space-y-2 text-sm">
            <li>• Registrar entregas de produtos para o armazém</li>
            <li>• Acompanhar o status dos seus produtos em estoque</li>
            <li>• Solicitar saídas e rastrear expedições</li>
            <li>• Visualizar relatórios de movimentação</li>
          </ul>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Dashboard</div>
              <div className="text-sm text-muted-foreground">Visão geral dos seus produtos</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Tutorial Interativo</div>
              <div className="text-sm text-muted-foreground">Aprender usando o sistema</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </div>
      </div>
    ),
    subsections: [
      {
        id: 'acessar-dashboard',
        title: 'Acessando o Dashboard',
        content: (
          <div className="space-y-4">
            <p>O Dashboard é sua página inicial e oferece uma visão geral de todas as suas operações.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Produtos em estoque</li>
              <li>Entregas pendentes de aprovação</li>
              <li>Pedidos de saída em andamento</li>
              <li>Gráfico de movimentação mensal</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'registrar-entregas',
    title: 'Registrar Entregas',
    description: 'Como registrar novos produtos no sistema',
    content: (
      <div className="space-y-6">
        <p>Para entregar seus produtos no armazém, você precisa primeiro registrar a entrada no sistema.</p>
        
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Passo a Passo
          </h4>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Clique em <strong>Entradas</strong> no menu lateral</li>
            <li>Clique no botão "Nova Entrada"</li>
            <li>Selecione o depósito de destino</li>
            <li>Adicione os produtos e quantidades</li>
            <li>Faça upload da Nota Fiscal</li>
            <li>Confirme e aguarde aprovação do franqueado</li>
          </ol>
        </Card>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Dica Importante</h5>
          <p className="text-sm">Sempre tenha a Nota Fiscal em mãos antes de registrar a entrada. O sistema pode extrair informações automaticamente do arquivo PDF.</p>
        </div>
      </div>
    )
  },
  {
    id: 'acompanhar-estoque',
    title: 'Acompanhar Estoque',
    description: 'Como visualizar seus produtos armazenados',
    content: (
      <div className="space-y-6">
        <p>Mantenha-se informado sobre a localização e status dos seus produtos no armazém.</p>
        
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações Disponíveis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Quantidade disponível por produto</li>
              <li>• Localização específica no armazém</li>
              <li>• Data de vencimento dos lotes</li>
            </ul>
            <ul className="space-y-2">
              <li>• Histórico de movimentações</li>
              <li>• Status de qualidade</li>
              <li>• Reservas para saídas futuras</li>
            </ul>
          </div>
        </Card>

        <div className="space-y-4">
          <h5 className="font-semibold">Como acessar:</h5>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Clique em <strong>Estoque</strong> no menu lateral</li>
            <li>Use os filtros para localizar produtos específicos</li>
            <li>Clique em um produto para ver detalhes completos</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'solicitar-saidas',
    title: 'Solicitar Saídas',
    description: 'Como requisitar a retirada de produtos do armazém',
    content: (
      <div className="space-y-6">
        <p>Quando precisar retirar produtos do armazém, faça a solicitação através do sistema.</p>
        
        <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Processo de Saída
          </h4>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Acesse <strong>Saídas</strong> no menu lateral</li>
            <li>Clique em "Nova Saída"</li>
            <li>Selecione os produtos e quantidades desejadas</li>
            <li>Escolha o destino e forma de transporte</li>
            <li>Confirme a solicitação</li>
            <li>Aguarde processamento pelo franqueado</li>
            <li>Acompanhe o status até a expedição</li>
          </ol>
        </Card>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⏰ Prazo de Processamento</h5>
          <p className="text-sm">Saídas solicitadas até 15h são processadas no mesmo dia. Solicitações após este horário são processadas no próximo dia útil.</p>
        </div>
      </div>
    )
  },
  {
    id: 'rastreamento',
    title: 'Rastreamento de Produtos',
    description: 'Como acompanhar o status das suas operações',
    content: (
      <div className="space-y-6">
        <p>Acompanhe em tempo real o status de todas as suas operações através da funcionalidade de rastreamento.</p>
        
        <Card className="p-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Status Disponíveis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h6 className="font-medium text-sm mb-2">Entradas:</h6>
              <ul className="text-xs space-y-1">
                <li>• Aguardando recebimento</li>
                <li>• Em conferência</li>
                <li>• Alocando em posições</li>
                <li>• Concluída</li>
              </ul>
            </div>
            <div>
              <h6 className="font-medium text-sm mb-2">Saídas:</h6>
              <ul className="text-xs space-y-1">
                <li>• Solicitada</li>
                <li>• Em separação</li>
                <li>• Pronta para expedição</li>
                <li>• Em transporte</li>
                <li>• Entregue</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'relatorios-simples',
    title: 'Relatórios Básicos',
    description: 'Como acessar informações sobre suas operações',
    content: (
      <div className="space-y-6">
        <p>Acesse relatórios simples para acompanhar o histórico das suas operações.</p>
        
        <Card className="p-6 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Disponíveis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Movimentação mensal</li>
              <li>• Produtos em estoque</li>
              <li>• Histórico de entregas</li>
            </ul>
            <ul className="space-y-2">
              <li>• Histórico de saídas</li>
              <li>• Status de operações</li>
              <li>• Resumo financeiro básico</li>
            </ul>
          </div>
        </Card>

        <div className="space-y-4">
          <h5 className="font-semibold">Como acessar relatórios:</h5>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Clique em <strong>Relatórios</strong> no menu lateral</li>
            <li>Selecione o período desejado</li>
            <li>Escolha o tipo de relatório</li>
            <li>Faça download em PDF ou Excel</li>
          </ol>
        </div>
      </div>
    )
  }
]

const InstrucoesProdutor = () => {
  return (
    <TableOfContents
      sections={produtorSections}
      title="Instruções para Produtores"
      subtitle="Guia simplificado para usar a plataforma AgroHub de forma eficiente"
    />
  )
}

export default InstrucoesProdutor