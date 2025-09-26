import React, { useState } from 'react'
import { PlayCircle, Book, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTutorial } from '@/contexts/TutorialContext'
import { useProfile } from '@/hooks/useProfile'
import { useCanAccessPage } from '@/hooks/usePagePermissions'
import { tutorialsByPage, getTutorialsForRole, PageTutorial } from '@/data/tutorialsByPage'

interface TutorialSelectorProps {
  onClose?: () => void
}

export const TutorialSelector = ({ onClose }: TutorialSelectorProps) => {
  const { startPageTutorial, isActive } = useTutorial()
  const { data: profile } = useProfile()
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null)

  // Filter tutorials based on user permissions
  const availableTutorials = tutorialsByPage.filter(tutorial => {
    const { canAccess } = useCanAccessPage(tutorial.pageKey)
    return canAccess
  })

  const handleStartTutorial = (tutorial: PageTutorial) => {
    startPageTutorial(tutorial.id)
    onClose?.()
  }

  const handleExpandTutorial = (tutorialId: string) => {
    setExpandedTutorial(expandedTutorial === tutorialId ? null : tutorialId)
  }

  if (isActive) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <Book className="h-8 w-8 mx-auto mb-2" />
        <p>Tutorial em andamento...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Escolha um Tutorial</h3>
        <p className="text-sm text-muted-foreground">
          Selecione o tutorial que você gostaria de aprender
        </p>
      </div>

      {availableTutorials.length === 0 ? (
        <div className="text-center text-muted-foreground p-4">
          <Book className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum tutorial disponível para seu perfil.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {availableTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{tutorial.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {tutorial.steps.length} {tutorial.steps.length === 1 ? 'passo' : 'passos'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartTutorial(tutorial)}
                      className="h-8 px-3"
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                    <Collapsible
                      open={expandedTutorial === tutorial.id}
                      onOpenChange={() => handleExpandTutorial(tutorial.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronDown 
                            className={`h-3 w-3 transition-transform ${
                              expandedTutorial === tutorial.id ? 'rotate-180' : ''
                            }`} 
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {tutorial.description}
                </CardDescription>
              </CardHeader>

              <Collapsible
                open={expandedTutorial === tutorial.id}
                onOpenChange={() => handleExpandTutorial(tutorial.id)}
              >
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Passos do tutorial:
                      </h4>
                      <div className="space-y-1">
                        {tutorial.steps.map((step, index) => (
                          <div 
                            key={step.id} 
                            className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                          >
                            <span className="text-xs bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-medium">{step.title}</div>
                              <div className="text-muted-foreground text-xs">
                                {step.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}