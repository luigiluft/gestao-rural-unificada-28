import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Pause, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTutorial } from '@/contexts/TutorialContext';
export const TutorialOverlay = () => {
  const {
    isActive,
    currentStepData,
    currentStep,
    totalSteps,
    progress,
    nextStep,
    previousStep,
    endTutorial,
    pauseTutorial,
    resumeTutorial,
    isPaused,
    simulateProducerAction,
    waitingForElement,
    handleTargetClick
  } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [modalPosition, setModalPosition] = useState({
    top: 0,
    left: 0
  });

  // Find target element and calculate positions
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) {
      setTargetElement(null);
      return;
    }
    const findElement = () => {
      const element = document.querySelector(currentStepData.targetElement!) as HTMLElement;
      if (element) {
        setTargetElement(element);

        // Calculate modal position based on element position and step position
        const rect = element.getBoundingClientRect();
        const modalWidth = 400;
        const modalHeight = 300;
        let top = 0;
        let left = 0;
        switch (currentStepData.position) {
          case 'top':
            top = rect.top - modalHeight - 20;
            left = rect.left + rect.width / 2 - modalWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - modalWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - modalHeight / 2;
            left = rect.left - modalWidth - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - modalHeight / 2;
            left = rect.right + 20;
            break;
        }

        // Ensure modal stays within viewport
        top = Math.max(20, Math.min(top, window.innerHeight - modalHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - modalWidth - 20));
        setModalPosition({
          top,
          left
        });
      }
    };

    // Try to find element immediately
    findElement();

    // If not found, try again after a short delay (for dynamic content)
    const timeout = setTimeout(findElement, 100);
    return () => clearTimeout(timeout);
  }, [isActive, currentStepData]);
  if (!isActive || !currentStepData) return null;

  // Check if we're in a modal
  const isInModal = currentStepData.modalTarget || targetElement && targetElement.closest('[role="dialog"], [data-state="open"]');
  return <>
      {/* Dark overlay - higher z-index if in modal */}
      <div className={`fixed inset-0 bg-black/50 ${isInModal ? 'z-[19999]' : 'z-40'}`} />
      
      {/* Spotlight effect on target element */}
      {targetElement && <div className={`fixed pointer-events-none ${isInModal ? 'z-[20000]' : 'z-50'}`} style={{
      top: targetElement.getBoundingClientRect().top - 4,
      left: targetElement.getBoundingClientRect().left - 4,
      width: targetElement.getBoundingClientRect().width + 8,
      height: targetElement.getBoundingClientRect().height + 8,
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
      borderRadius: '4px'
    }} />}
      
      {/* Tutorial modal */}
      <Card className={`fixed w-96 shadow-xl border-primary/20 ${isInModal ? 'z-[20001]' : 'z-50'}`} style={{
      top: targetElement ? modalPosition.top : '50%',
      left: targetElement ? modalPosition.left : '50%',
      transform: targetElement ? 'none' : 'translate(-50%, -50%)'
    }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={endTutorial} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Passo {currentStep + 1} de {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
          
          {/* Producer dependency warning */}
          {currentStepData.requiresProducer && <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Esta etapa depende de uma ação do produtor. Você pode simular a ação para continuar o tutorial.
              </AlertDescription>
            </Alert>}
          
          {/* Waiting for element */}
          {waitingForElement}

          {/* Interactive feedback for click actions */}
          {currentStepData.action === 'click' && !waitingForElement && <Alert className="border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <AlertDescription className="text-primary font-medium">
                  Clique no elemento destacado para continuar
                </AlertDescription>
              </div>
            </Alert>}
          
          {/* Current step badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {currentStepData.action === 'wait_producer' ? 'Aguardando Produtor' : currentStepData.action === 'click' ? 'Clique Necessário' : currentStepData.action === 'form_fill' ? 'Preencher Formulário' : currentStepData.action === 'wait_modal' ? 'Aguardando Modal' : currentStepData.action === 'fill_field' ? 'Preencher Campo' : 'Informativo'}
            </Badge>
            {isPaused && <Badge variant="outline" className="text-orange-600">
                Pausado
              </Badge>}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={previousStep} disabled={currentStep === 0} className="gap-1">
              <ChevronLeft className="h-3 w-3" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {currentStepData.requiresProducer && <Button variant="outline" size="sm" onClick={simulateProducerAction} className="gap-1">
                  Simular Ação
                </Button>}
              
              {isPaused ? <Button variant="outline" size="sm" onClick={resumeTutorial} className="gap-1">
                  <Play className="h-3 w-3" />
                  Continuar
                </Button> : <Button variant="outline" size="sm" onClick={pauseTutorial} className="gap-1">
                  <Pause className="h-3 w-3" />
                  Pausar
                </Button>}
              
              {/* Only show Next button for non-click actions or when waiting for elements */}
              {(currentStepData.action !== 'click' || waitingForElement) && <Button size="sm" onClick={nextStep} className="gap-1">
                  {currentStep === totalSteps - 1 ? 'Finalizar' : 'Próximo'}
                  <ChevronRight className="h-3 w-3" />
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>
    </>;
};