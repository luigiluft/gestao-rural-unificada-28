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
  action?: 'click' | 'navigate' | 'wait_producer' | 'form_fill'
  waitCondition?: string
  dependencies?: string[]
  autoNavigation: boolean
  requiresProducer?: boolean
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

  const startTutorial = () => {
    setIsActive(true)
    setCurrentStep(0)
    setIsPaused(false)
    navigate('/dashboard')
  }

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
      simulateProducerAction
    }}>
      {children}
    </TutorialContext.Provider>
  )
}