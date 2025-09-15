import { TableOfContents, InstructionSection } from '@/components/Instrucoes/TableOfContents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Warehouse, TruckIcon, Package, Send, BarChart, Users } from 'lucide-react'

const franqueadoSections: InstructionSection[] = [
  {
    id: 'gestao-armazem',
    title: 'Gestão do Armazém',
    description: 'Administração completa das operações do seu armazém',
    content: (
      <div className="space-y-6">
        <p className="text-lg">Como franqueado, você é responsável pela gestão operacional do seu armazém. Esta seção abrange todas as atividades essenciais.</p>
        
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Responsabilidades Principais
          </h4>
          <ul className="space-y-2 text-sm">
            <li>• Recebimento e conferência de mercadorias</li>
            <li>• Gestão de posições e alocações</li>
            <li>• Supervisão de separação e expedição</li>
            <li>• Controle de qualidade e estoque</li>
          </ul>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Dashboard Operacional</div>
              <div className="text-sm text-muted-foreground">Visão geral das operações</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Gestão de Posições</div>
              <div className="text-sm text-muted-foreground">Configurar layout do armazém</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </div>
      </div>
    ),
    subsections: [
      {
        id: 'configuracao-posicoes',
        title: 'Configuração de Posições',
        content: (
          <div className="space-y-4">
            <p>Acesse <strong>Gerenciar Posições</strong> no menu lateral para configurar o layout do seu armazém.</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Defina zonas de armazenamento (A, B, C, etc.)</li>
              <li>Configure ruas e posições específicas</li>
              <li>Estabeleça regras de alocação (FEFO, prioridades)</li>
              <li>Teste a configuração com mercadorias piloto</li>
            </ol>
          </div>
        )
      }
    ]
  },
  {
    id: 'recebimento-mercadorias',
    title: 'Recebimento de Mercadorias',
    description: 'Processo completo de recebimento e conferência',
    content: (
      <div className="space-y-6">
        <p>O recebimento é a primeira etapa crítica da operação. Siga os procedimentos para garantir qualidade e rastreabilidade.</p>
        
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Fluxo de Recebimento
          </h4>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Aguarde entrada ser registrada no sistema (pelo produtor)</li>
            <li>Acesse <strong>Recebimento</strong> no menu lateral</li>
            <li>Identifique a entrada pendente</li>
            <li>Confira documentação e quantidade</li>
            <li>Execute conferência física dos produtos</li>
            <li>Aprove ou rejeite a entrada com observações</li>
            <li>Proceda com alocação em posições</li>
          </ol>
        </Card>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠️ Pontos de Atenção</h5>
          <ul className="text-sm space-y-1">
            <li>• Verificar integridade das embalagens</li>
            <li>• Conferir prazos de validade</li>
            <li>• Registrar qualquer divergência</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'gestao-estoque',
    title: 'Gestão de Estoque',
    description: 'Controle e monitoramento do estoque local',
    content: (
      <div className="space-y-6">
        <p>Mantenha controle total sobre os produtos armazenados em sua franquia.</p>
        
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Monitoramento Contínuo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Acompanhar níveis de estoque</li>
              <li>• Monitorar movimentações</li>
              <li>• Verificar prazos de validade</li>
            </ul>
            <ul className="space-y-2">
              <li>• Executar inventários periódicos</li>
              <li>• Identificar divergências</li>
              <li>• Otimizar layout de posições</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'separacao-expedicao',
    title: 'Separação e Expedição',
    description: 'Processo de preparação e envio de pedidos',
    content: (
      <div className="space-y-6">
        <p>A separação e expedição são etapas críticas para atender aos pedidos dos clientes com qualidade e pontualidade.</p>
        
        <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Fluxo de Expedição
          </h4>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Aguardar aprovação da saída pelo produtor</li>
            <li>Acessar <strong>Separação</strong> no menu lateral</li>
            <li>Visualizar itens a serem separados</li>
            <li>Localizar produtos nas posições indicadas</li>
            <li>Confirmar separação via scanner ou sistema</li>
            <li>Proceder para <strong>Expedição</strong></li>
            <li>Preparar documentação de transporte</li>
            <li>Coordenar com transportadora</li>
          </ol>
        </Card>
      </div>
    )
  },
  {
    id: 'relatorios-franquia',
    title: 'Relatórios da Franquia',
    description: 'Análise de performance e indicadores operacionais',
    content: (
      <div className="space-y-6">
        <p>Utilize os relatórios para acompanhar a performance operacional da sua franquia.</p>
        
        <Card className="p-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Indicadores Principais
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Volume de entrada/saída</li>
              <li>• Tempo médio de processamento</li>
              <li>• Taxa de ocupação do armazém</li>
            </ul>
            <ul className="space-y-2">
              <li>• Acuracidade de estoque</li>
              <li>• Performance de separação</li>
              <li>• Satisfação dos produtores</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'gestao-equipe',
    title: 'Gestão de Equipe',
    description: 'Administração de funcionários e subcontas',
    content: (
      <div className="space-y-6">
        <p>Gerencie sua equipe de operação e configure acessos adequados para cada função.</p>
        
        <Card className="p-6 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
          <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tipos de Funcionários
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <Badge className="mb-2">Operador</Badge>
              <p className="text-sm">Separação e movimentação</p>
            </Card>
            <Card className="p-4 text-center">
              <Badge variant="secondary" className="mb-2">Conferente</Badge>
              <p className="text-sm">Recebimento e conferência</p>
            </Card>
            <Card className="p-4 text-center">
              <Badge variant="outline" className="mb-2">Supervisor</Badge>
              <p className="text-sm">Gestão operacional</p>
            </Card>
          </div>
        </Card>

        <div className="space-y-4">
          <h5 className="font-semibold">Como criar subcontas:</h5>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Acesse <strong>Perfis de Funcionários</strong> no menu</li>
            <li>Clique em "Novo Funcionário"</li>
            <li>Defina as permissões específicas</li>
            <li>Envie convite por email</li>
          </ol>
        </div>
      </div>
    )
  }
]

const InstrucoesFranqueado = () => {
  return (
    <TableOfContents
      sections={franqueadoSections}
      title="Instruções para Franqueados"
      subtitle="Guia operacional completo para gestão eficiente do seu armazém AgroHub"
    />
  )
}

export default InstrucoesFranqueado