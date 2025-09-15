import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { tutorialSteps } from '@/data/tutorialSteps'

export interface TutorialStep {
  id: string
  title: string
  description: string
  page: string
  targetElement?: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: 'click' | 'navigate' | 'wait_producer' | 'form_fill' | 'wait_modal' | 'fill_field' | 'none'
  waitCondition?: string
  dependencies?: string[]
  autoNavigation: boolean
  requiresProducer?: boolean
  modalTarget?: boolean
  fieldValue?: string
}

interface TutorialContextType {
  isActive: boolean
  currentStep: number
  totalSteps: number
  currentStepData: TutorialStep | null
  progress: number
  startTutorial: () => void
  nextStep: () => void
  previousStep: () => void
  endTutorial: () => void
  pauseTutorial: () => void
  resumeTutorial: () => void
  isPaused: boolean
  simulateProducerAction: () => void
  waitingForElement: boolean
  handleTargetClick: (element: Element) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

interface TutorialProviderProps {
  children: ReactNode
}

export const TutorialProvider = ({ children }: TutorialProviderProps) => {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [waitingForElement, setWaitingForElement] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const totalSteps = tutorialSteps.length
  const currentStepData = isActive ? tutorialSteps[currentStep] : null
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  // Load tutorial state from localStorage - DISABLED for manual start only
  // useEffect(() => {
  //   const savedState = localStorage.getItem('tutorial-state')
  //   if (savedState) {
  //     const { isActive: savedActive, currentStep: savedStep } = JSON.parse(savedState)
  //     if (savedActive) {
  //       setIsActive(true)
  //       setCurrentStep(savedStep)
  //     }
  //   }
  // }, [])

  // Save tutorial state to localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem('tutorial-state', JSON.stringify({ isActive, currentStep }))
    } else {
      localStorage.removeItem('tutorial-state')
    }
  }, [isActive, currentStep])

  // Auto-navigate when step changes
  // Navigation based on current step with demo route handling
  useEffect(() => {
    if (!isActive || !currentStepData) return

    // Determine the target page - use demo version during tutorial
    let targetPage = currentStepData.page
    if (targetPage && isActive) {
      // Convert regular routes to demo routes during tutorial
      const demoRoutes = {
        '/dashboard': '/demo/dashboard',
        '/entradas': '/demo/entradas', 
        '/estoque': '/demo/estoque',
        '/saidas': '/demo/saidas'
      }
      
      targetPage = demoRoutes[targetPage as keyof typeof demoRoutes] || targetPage
    }

    // Only navigate if we're not already on the target page
    if (targetPage && location.pathname !== targetPage) {
      if (currentStepData.autoNavigation !== false) {
        navigate(targetPage)
      }
    }
  }, [currentStep, isActive, currentStepData, navigate, location.pathname])

  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => {
        const nextStepNumber = prev + 1
        const nextStepData = tutorialSteps[nextStepNumber]
        
        // Special handling for transition from formulario-preenchido-sem-backdrop to formulario-preenchido-com-backdrop
        if (nextStepData.id === 'formulario-preenchido-com-backdrop') {
          setTimeout(() => {
            const registrarBtn = document.querySelector('[data-tutorial="registrar-entrada-btn"]')
            if (registrarBtn) {
              registrarBtn.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }
          }, 500)
        }
        
        return nextStepNumber
      })
      setIsPaused(false)
    } else {
      // Inline endTutorial to avoid TDZ issues
      setIsActive(false)
      setCurrentStep(0)
      setIsPaused(false)
      localStorage.removeItem('tutorial-state')
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setIsPaused(false)
    }
  }

  const endTutorial = () => {
    setIsActive(false)
    setCurrentStep(0)
    setIsPaused(false)
    localStorage.removeItem('tutorial-state')
  }

  const pauseTutorial = () => {
    setIsPaused(true)
  }

  const resumeTutorial = () => {
    setIsPaused(false)
  }

  const simulateProducerAction = () => {
    // For now, just advance to next step
    // This could be enhanced to actually create demo data
    nextStep()
  }

  const handleTargetClick = (element: Element) => {
    if (!isActive || !currentStepData) return
    
    // Check if clicked element matches target
    if (currentStepData.targetElement) {
      const targetElement = document.querySelector(currentStepData.targetElement)
      if (targetElement && (element === targetElement || targetElement.contains(element))) {
        
        // Special handling for file upload simulation
        if (currentStepData.id === 'selecionar-arquivo-nf') {
          // Simulate file upload with mock NF data
          simulateNFUpload()
          return
        }
        
        // Only advance for click actions
        if (currentStepData.action === 'click') {
          setTimeout(() => nextStep(), 300) // Small delay for visual feedback
        }
      }
    }
  }

  const simulateNFUpload = async () => {
    try {
      // Fetch tutorial data from the dedicated tutorial tables
      const { supabase } = await import('@/integrations/supabase/client')
      
      const { data: tutorialEntrada, error: entradaError } = await supabase
        .from('tutorial_entradas')
        .select('*')
        .eq('numero_nfe', '000123456')
        .single()

      if (entradaError) {
        console.error('Erro ao buscar entrada tutorial:', entradaError)
        return
      }

      const { data: tutorialItens, error: itensError } = await supabase
        .from('tutorial_entrada_itens')
        .select('*')
        .eq('tutorial_entrada_id', tutorialEntrada.id)

      if (itensError) {
        console.error('Erro ao buscar itens tutorial:', itensError)
        return
      }

      console.log('Dados tutorial carregados:', { tutorialEntrada, tutorialItens })

      // Create the mock NF data object that will be used to fill the form
      const mockNFData = {
        numeroNF: tutorialEntrada.numero_nfe,
        serie: tutorialEntrada.serie,
        cnpjEmitente: tutorialEntrada.emitente_cnpj,
        nomeEmitente: tutorialEntrada.emitente_nome,
        dataEmissao: tutorialEntrada.data_emissao,
        naturezaOperacao: tutorialEntrada.natureza_operacao,
        valorTotal: tutorialEntrada.valor_total,
        xmlContent: '<nfeProc><!-- Tutorial Mock XML content --></nfeProc>',
        produtos: tutorialItens.map(item => ({
          codigo: item.codigo_produto,
          descricao: item.descricao_produto,
          quantidade: item.quantidade,
          unidade: item.unidade_comercial,
          valorUnitario: item.valor_unitario,
          lote: item.lote
        }))
      }

      // Trigger the file upload simulation with the tutorial data
        setTimeout(() => {
          const event = new CustomEvent('tutorial-nf-upload', {
            detail: mockNFData
          })
          document.dispatchEvent(event)
          
          // Auto-advance to show the filled form without backdrop
          if (currentStepData?.id === 'selecionar-arquivo-nf') {
            setTimeout(() => nextStep(), 800)
          }
        }, 500)
      
    } catch (error) {
      console.error('Erro ao simular upload da NF:', error)
      // Fallback to the old simulation method if database fails
      const mockNFData = {
        numeroNF: 'NF001245',
        serie: '001',
        cnpjEmitente: '12.345.678/0001-90',
        nomeEmitente: 'Fazenda Demo Ltda',
        dataEmissao: new Date().toISOString().split('T')[0],
        valorTotal: 2100.00,
        xmlContent: '<nfeProc><!-- Mock XML content --></nfeProc>',
        produtos: [
          {
            codigo: 'SOJ001',
            descricao: 'Soja em Grão',
            quantidade: 1000,
            unidade: 'KG',
            valorUnitario: 1.50
          },
          {
            codigo: 'MIL002', 
            descricao: 'Milho em Grão',
            quantidade: 500,
            unidade: 'KG',
            valorUnitario: 1.20
          }
        ]
      }

      setTimeout(() => {
        const event = new CustomEvent('tutorial-nf-upload', {
          detail: mockNFData
        })
        document.dispatchEvent(event)
        
        // Auto-advance to show the filled form without backdrop
        if (currentStepData?.id === 'selecionar-arquivo-nf') {
          setTimeout(() => nextStep(), 800)
        }
      }, 500)
    }
  }

  // Click detection and visual highlighting system
  useEffect(() => {
    if (!isActive || !currentStepData) return

    // Listen for tutorial trigger event
    const handleTutorialTrigger = () => {
      // Always simulate NF upload when tutorial is active
      simulateNFUpload()
    }

    // Add click listener to detect clicks on target elements
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element
      handleTargetClick(target)
    }

    document.addEventListener('tutorial-trigger-nf-upload', handleTutorialTrigger)

    // Add highlight class to target element
    const addHighlight = () => {
      if (currentStepData.targetElement) {
        const element = document.querySelector(currentStepData.targetElement)
        if (element) {
          element.classList.add('tutorial-highlight')
          
          // Add spotlight effect for click actions
          if (currentStepData.action === 'click') {
            element.classList.add('tutorial-spotlight')
          }
        }
      }
    }

    // Remove highlight class from all elements
    const removeHighlight = () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight', 'tutorial-spotlight')
      })
    }

    document.addEventListener('click', handleDocumentClick)
    
    // Add highlight after a brief delay to ensure element exists
    const timer = setTimeout(addHighlight, 100)
    
    return () => {
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('tutorial-trigger-nf-upload', handleTutorialTrigger)
      clearTimeout(timer)
      removeHighlight()
    }
  }, [isActive, currentStepData])

  // MutationObserver to detect dynamic content changes
  useEffect(() => {
    if (!isActive || !currentStepData) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if target element appeared
          if (currentStepData.targetElement) {
            const element = document.querySelector(currentStepData.targetElement)
            if (element && waitingForElement) {
              setWaitingForElement(false)
              
              // Auto-advance for certain actions (but not clicks)
              if (currentStepData.action === 'wait_modal') {
                setTimeout(() => nextStep(), 1000)
              }
            }
          }
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'aria-hidden']
    })

    return () => observer.disconnect()
  }, [isActive, currentStepData, waitingForElement])

  // Wait for elements to appear
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) return

    const checkElement = () => {
      const element = document.querySelector(currentStepData.targetElement!)
      if (!element) {
        setWaitingForElement(true)
        // Retry after delay
        setTimeout(checkElement, 500)
      } else {
        setWaitingForElement(false)
      }
    }

    checkElement()
  }, [isActive, currentStepData])

  const startTutorial = () => {
    setIsActive(true)
    setCurrentStep(0)
    setIsPaused(false)
    navigate('/')
  }

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentStep,
      totalSteps,
      currentStepData,
      progress,
      startTutorial,
      nextStep,
      previousStep,
      endTutorial,
      pauseTutorial,
      resumeTutorial,
      isPaused,
      simulateProducerAction,
      waitingForElement,
      handleTargetClick
    }}>
      {children}
    </TutorialContext.Provider>
  )
}