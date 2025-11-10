import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, PlayCircle, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTutorial } from "@/contexts/TutorialContext"

const Tutorial = () => {
  const navigate = useNavigate()
  const { startTutorial, isActive } = useTutorial()

  const handleStartTutorial = () => {
    startTutorial()
    navigate("/demo/dashboard")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tutorial Interativo</h1>
        <p className="text-muted-foreground mt-2">
          Aprenda a usar o sistema com nossos tutoriais guiados passo a passo
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tutorial Completo</CardTitle>
                <CardDescription>
                  Fluxo completo desde recebimento até expedição
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aprenda todo o processo operacional do sistema:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Recebimento de produtos com planejamento de pallets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Gestão de estoque e alocação de posições</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Processamento de saídas e separação</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Expedição e gestão de entregas</span>
              </li>
            </ul>
            <Button 
              className="w-full bg-gradient-primary hover:bg-primary/90"
              onClick={handleStartTutorial}
              disabled={isActive}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {isActive ? "Tutorial em Andamento" : "Iniciar Tutorial"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle>Guias de Instruções</CardTitle>
                <CardDescription>
                  Documentação detalhada por perfil de usuário
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Acesse guias específicos para cada tipo de usuário:
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/instrucoes")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Instruções Gerais
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Info className="h-6 w-6 text-accent" />
              </div>
              <div>
                <CardTitle>Como Funciona o Tutorial</CardTitle>
                <CardDescription>
                  Entenda como aproveitar ao máximo o tutorial interativo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                  <span>Navegação Guiada</span>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  O sistema irá guiá-lo por cada etapa do processo com instruções claras e objetivas.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">2</span>
                  <span>Dados de Exemplo</span>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Utilize dados fictícios para praticar sem afetar informações reais do sistema.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  <span>Prática Segura</span>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  Todas as ações durante o tutorial são simuladas e não afetam o banco de dados real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Tutorial
