import { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { TutorialOverlay } from "@/components/Tutorial/TutorialOverlay"
import { useTutorial } from "@/contexts/TutorialContext"

function AppLayoutContent({ children }: { children?: ReactNode }) {
  const { isActive, currentStepData } = useTutorial()
  
  // Check if current step is about presenting the current page
  const isPagePresentation = isActive && currentStepData && (
    // Welcome step (first step) 
    currentStepData.id === 'welcome' ||
    // Dashboard overview step
    currentStepData.id === 'dashboard-overview' ||
    // Steps that are about page navigation/introduction
    currentStepData.id === 'verificar-estoque' ||
    currentStepData.id === 'navigate-saidas' ||
    currentStepData.id === 'navigate-separacao' ||
    currentStepData.id === 'navigate-transporte' ||
    // Steps that show general page info without specific targets or have autoNavigation
    (!currentStepData.targetElement && !currentStepData.action && currentStepData.autoNavigation) ||
    // Steps that introduce a page (no action, just presenting the page)
    (!currentStepData.action && currentStepData.autoNavigation === false && currentStepData.targetElement)
  )

  // Debug log
  if (isActive && currentStepData) {
    console.log('Tutorial Debug:', {
      stepId: currentStepData.id,
      currentPage: window.location.pathname,
      stepPage: currentStepData.page,
      isPagePresentation,
      hasTargetElement: !!currentStepData.targetElement,
      action: currentStepData.action,
      autoNavigation: currentStepData.autoNavigation,
      highlightClass: isPagePresentation ? 'tutorial-page-highlight' : 'none'
    })
  }
  
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-hidden transition-all duration-500 w-full max-w-full">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

interface AppLayoutProps {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TutorialProvider>
      <SidebarProvider>
        <AppLayoutContent>
          {children}
        </AppLayoutContent>
        <TutorialOverlay />
      </SidebarProvider>
    </TutorialProvider>
  )
}
