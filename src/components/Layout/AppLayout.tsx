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
    // Dashboard overview step
    currentStepData.id === 'dashboard-overview' ||
    // Steps that are about page navigation/introduction
    currentStepData.id === 'verificar-estoque' ||
    currentStepData.id === 'navigate-saidas' ||
    currentStepData.id === 'navigate-separacao' ||
    currentStepData.id === 'navigate-transporte' ||
    // Steps that show general page info without specific targets
    (!currentStepData.targetElement && !currentStepData.action) ||
    // Welcome step on dashboard
    (currentStepData.id === 'welcome' && window.location.pathname.includes('dashboard'))
  )
  
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className={`flex-1 p-4 lg:p-6 overflow-auto transition-all duration-500 ${
          isPagePresentation ? 'tutorial-page-highlight' : ''
        }`}>
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
