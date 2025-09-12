import { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { TutorialOverlay } from "@/components/Tutorial/TutorialOverlay"

interface AppLayoutProps {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TutorialProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1 p-4 lg:p-6 overflow-auto">
              {children ?? <Outlet />}
            </main>
          </div>
        </div>
        <TutorialOverlay />
      </SidebarProvider>
    </TutorialProvider>
  )
}
