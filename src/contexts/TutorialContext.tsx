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
      setCurrentStep(prev => prev + 1)
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
      // Create mock entry data directly in the database
      const { supabase } = await import('@/integrations/supabase/client')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      // First, create the main entry
      const entryData = {
        user_id: user.id,
        numero_nfe: 'NF001245',
        serie: '001',
        data_entrada: new Date().toISOString().split('T')[0],
        data_emissao: new Date().toISOString().split('T')[0],
        emitente_nome: 'Fazenda Demo Ltda',
        emitente_cnpj: '12.345.678/0001-90',
        valor_total: 2100.00,
        natureza_operacao: 'Venda de produtos agrícolas',
        status_aprovacao: 'planejamento' as const,
        xml_content: '<nfeProc><!-- Mock XML content --></nfeProc>'
      }
      
      const { data: entrada, error: entryError } = await supabase
        .from('entradas')
        .insert(entryData)
        .select()
        .single()
      
      if (entryError) {
        console.error('Erro ao criar entrada:', entryError)
        return
      }
      
      // Then create the entry items
      const itemsData = [
        {
          user_id: user.id,
          entrada_id: entrada.id,
          nome_produto: 'Soja em Grão',
          codigo_produto: 'SOJ001',
          descricao_produto: 'Soja em grão tipo exportação',
          quantidade: 1000,
          unidade_comercial: 'KG',
          valor_unitario: 1.50,
          valor_total: 1500.00,
          lote: 'LOTE001'
        },
        {
          user_id: user.id,
          entrada_id: entrada.id,
          nome_produto: 'Milho em Grão',
          codigo_produto: 'MIL002',
          descricao_produto: 'Milho em grão amarelo',
          quantidade: 500,
          unidade_comercial: 'KG',
          valor_unitario: 1.20,
          valor_total: 600.00,
          lote: 'LOTE002'
        }
      ]
      
      const { error: itemsError } = await supabase
        .from('entrada_itens')
        .insert(itemsData)
      
      if (itemsError) {
        console.error('Erro ao criar itens da entrada:', itemsError)
        return
      }

      // Create the mock NF data object that will be used to fill the form
      const mockNFData = {
        numeroNF: entryData.numero_nfe,
        serie: entryData.serie,
        cnpjEmitente: entryData.emitente_cnpj,
        nomeEmitente: entryData.emitente_nome,
        dataEmissao: entryData.data_emissao,
        naturezaOperacao: entryData.natureza_operacao,
        valorTotal: entryData.valor_total,
        xmlContent: entryData.xml_content,
        entradaId: entrada.id, // Include the created entry ID
        produtos: itemsData.map(item => ({
          codigo: item.codigo_produto,
          descricao: item.descricao_produto,
          quantidade: item.quantidade,
          unidade: item.unidade_comercial,
          valorUnitario: item.valor_unitario,
          lote: item.lote
        }))
      }

      // Trigger the file upload simulation with the database entry
      setTimeout(() => {
        const event = new CustomEvent('tutorial-nf-upload', {
          detail: mockNFData
        })
        document.dispatchEvent(event)
        
        // Auto-advance to show the filled form after a delay
        setTimeout(() => {
          nextStep()
        }, 1500)
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
        
        setTimeout(() => {
          nextStep()
        }, 1500)
      }, 500)
    }
  }

  // Click detection and visual highlighting system
  useEffect(() => {
    if (!isActive || !currentStepData) return

    // Add click listener to detect clicks on target elements
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element
      handleTargetClick(target)
    }

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