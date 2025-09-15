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
  action?: 'click' | 'navigate' | 'wait_producer' | 'form_fill' | 'wait_modal' | 'fill_field'
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

  // Load tutorial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('tutorial-state')
    if (savedState) {
      const { isActive: savedActive, currentStep: savedStep } = JSON.parse(savedState)
      if (savedActive) {
        setIsActive(true)
        setCurrentStep(savedStep)
      }
    }
  }, [])

  // Save tutorial state to localStorage
  useEffect(() => {
    if (isActive) {
      localStorage.setItem('tutorial-state', JSON.stringify({ isActive, currentStep }))
    } else {
      localStorage.removeItem('tutorial-state')
    }
  }, [isActive, currentStep])

  // Auto-navigate when step changes
  useEffect(() => {
    if (isActive && currentStepData && currentStepData.autoNavigation) {
      const targetPage = currentStepData.page
      if (location.pathname !== targetPage) {
        navigate(targetPage)
      }
    }
  }, [currentStep, isActive, currentStepData, navigate, location.pathname])

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
      setIsPaused(false)
    } else {
      endTutorial()
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
              
              // Auto-advance for certain actions
              if (currentStepData.action === 'wait_modal') {
                setTimeout(() => nextStep(), 1000)
              }
            }
          }
          
          // Detect modal openings
          const modals = document.querySelectorAll('[role="dialog"], .modal, [data-state="open"]')
          if (modals.length > 0 && currentStepData.action === 'click') {
            setTimeout(() => nextStep(), 500)
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
  }, [isActive, currentStepData, waitingForElement, nextStep])

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
      waitingForElement
    }}>
      {children}
    </TutorialContext.Provider>
  )
}