import { TableOfContents, InstructionSection } from '@/components/Instrucoes/TableOfContents'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Users, Building2, Package, Truck, BarChart3, Settings } from 'lucide-react'

const adminSections: InstructionSection[] = [
  {
    id: 'gestao-sistema',
    title: 'Gestão do Sistema',
    description: 'Configurações globais e administração da plataforma',
    content: (
      <div className="space-y-6">
        <p className="text-lg">Como administrador, você tem acesso completo a todas as funcionalidades da plataforma AgroHub. Esta seção cobre as principais responsabilidades administrativas.</p>
        
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Principais Responsabilidades
          </h4>
          <ul className="space-y-2 text-sm">
            <li>• Configuração de franquias e usuários</li>
            <li>• Controle de permissões e acessos</li>
            <li>• Monitoramento de operações</li>
            <li>• Configurações do sistema</li>
          </ul>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Configurações</div>
              <div className="text-sm text-muted-foreground">Acessar configurações globais</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="outline" className="justify-start h-auto p-4">
            <div className="text-left">
              <div className="font-medium">Controle de Acesso</div>
              <div className="text-sm text-muted-foreground">Gerenciar permissões</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </div>
      </div>
    ),
    subsections: [
      {
        id: 'configuracoes-globais',
        title: 'Configurações Globais',
        content: (
          <div className="space-y-4">
            <p>Acesse <strong>Configurações</strong> no menu lateral para ajustar parâmetros globais do sistema.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Configurações de notificações</li>
              <li>Parâmetros de estoque</li>
              <li>Configurações de integração</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: 'gestao-franquias',
    title: 'Gestão de Franquias',
    description: 'Cadastro e gerenciamento de franquias do sistema',
    content: (
      <div className="space-y-6">
        <p>O módulo de franquias permite criar e gerenciar todas as unidades operacionais do sistema.</p>
        
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Processo de Cadastro
          </h4>
          <ol className="list-decimal pl-6 space-y-2 text-sm">
            <li>Acesse <strong>Franquias</strong> no menu lateral</li>
            <li>Clique em "Nova Franquia"</li>
            <li>Preencha os dados básicos da franquia</li>
            <li>Configure o layout do armazém</li>
            <li>Defina posições de armazenamento</li>
            <li>Salve e ative a franquia</li>
          </ol>
        </Card>
      </div>
    )
  },
  {
    id: 'gestao-usuarios',
    title: 'Gestão de Usuários',
    description: 'Controle de usuários, roles e permissões',
    content: (
      <div className="space-y-6">
        <p>Gerencie todos os usuários do sistema e suas permissões de acesso.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Badge className="mb-2">Admin</Badge>
            <p className="text-sm">Acesso total ao sistema</p>
          </Card>
          <Card className="p-4 text-center">
            <Badge variant="secondary" className="mb-2">Franqueado</Badge>
            <p className="text-sm">Gestão de franquia local</p>
          </Card>
          <Card className="p-4 text-center">
            <Badge variant="outline" className="mb-2">Produtor</Badge>
            <p className="text-sm">Acesso limitado aos próprios produtos</p>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'operacoes-estoque',
    title: 'Operações de Estoque',
    description: 'Supervisão completa de entradas, saídas e movimentações',
    content: (
      <div className="space-y-6">
        <p>Como administrador, você pode visualizar e gerenciar todas as operações de estoque em todas as franquias.</p>
        
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fluxo Operacional
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">1. Entradas</div>
              <div className="text-muted-foreground">Recebimento de mercadorias</div>
            </div>
            <div className="text-center">
              <div className="font-medium">2. Alocação</div>
              <div className="text-muted-foreground">Definição de posições</div>
            </div>
            <div className="text-center">
              <div className="font-medium">3. Saídas</div>
              <div className="text-muted-foreground">Expedição de produtos</div>
            </div>
            <div className="text-center">
              <div className="font-medium">4. Transporte</div>
              <div className="text-muted-foreground">Rastreamento de entrega</div>
            </div>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'relatorios-analytics',
    title: 'Relatórios e Analytics',
    description: 'Análise de dados e relatórios gerenciais',
    content: (
      <div className="space-y-6">
        <p>Acesse relatórios detalhados e analytics para tomada de decisões estratégicas.</p>
        
        <Card className="p-6 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tipos de Relatórios
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ul className="space-y-2">
              <li>• Relatórios de estoque por franquia</li>
              <li>• Análise de movimentação</li>
              <li>• Performance operacional</li>
            </ul>
            <ul className="space-y-2">
              <li>• Relatórios financeiros</li>
              <li>• Indicadores de qualidade</li>
              <li>• Análise de produtores</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  },
  {
    id: 'suporte-manutencao',
    title: 'Suporte e Manutenção',
    description: 'Ferramentas de diagnóstico e suporte ao sistema',
    content: (
      <div className="space-y-6">
        <p>Utilize as ferramentas administrativas para manutenção e suporte do sistema.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h5 className="font-semibold mb-2">Logs do Sistema</h5>
            <p className="text-sm text-muted-foreground">Monitore atividades e identifique problemas</p>
          </Card>
          <Card className="p-4">
            <h5 className="font-semibold mb-2">Backup e Restore</h5>
            <p className="text-sm text-muted-foreground">Gerenciar backups automáticos</p>
          </Card>
        </div>
      </div>
    )
  }
]

const InstrucoesAdmin = () => {
  return (
    <TableOfContents
      sections={adminSections}
      title="Instruções para Administradores"
      subtitle="Guia completo para administração e configuração da plataforma AgroHub"
    />
  )
}

export default InstrucoesAdmin