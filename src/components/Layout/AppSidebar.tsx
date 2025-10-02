import { useEffect, useState } from "react"
import {
  LogOut,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import logoImg from "@/assets/agrohub-logo.svg"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useDynamicMenuItems } from "@/hooks/useDynamicMenuItems"
import { useNotifications } from "@/hooks/useNotifications"
import { TutorialButton } from "@/components/Tutorial/TutorialButton"
import { useTutorial } from "@/contexts/TutorialContext"

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const { user, logout } = useAuth()
  const [displayName, setDisplayName] = useState<string>("")
  const [customLogo, setCustomLogo] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  const { data: notifications } = useNotifications()
  const { menuItems, isLoading: menuLoading } = useDynamicMenuItems()
  const { isActive: isTutorialActive } = useTutorial()

  const initials = (displayName || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Carregando logo personalizado do localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem("agro-logo-url")
    setCustomLogo(savedLogo)
    
    const handleSettingsChange = () => {
      const updatedLogo = localStorage.getItem("agro-logo-url")
      setCustomLogo(updatedLogo)
    }
    
    window.addEventListener("agro-settings-changed", handleSettingsChange)
    
    return () => {
      window.removeEventListener("agro-settings-changed", handleSettingsChange)
    }
  }, [])
  
  useEffect(() => {
    const load = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", user.id)
        .maybeSingle()
      if (!error && data?.nome) {
        setDisplayName(data.nome)
      } else {
        setDisplayName((user.user_metadata as any)?.nome || user.email?.split("@")[0] || "Usuário")
      }
    }
    load()
  }, [user])

  const getNavClasses = (active: boolean) => {
    return active 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-secondary/50 transition-all duration-200"
  }

  const getNotificationCount = (title: string, notifications: any) => {
    if (!notifications) return 0
    
    switch (title) {
      case "Recebimento":
        return notifications.recebimento || 0
      case "Estoque":
        return notifications.estoque || 0
      case "Alocação de Pallets":
        return notifications.alocacoes || 0
      case "Separação":
        return notifications.separacao || 0
      case "Expedição":
        return notifications.expedicao || 0
      case "Remessas":
        return notifications.remessas || 0
      case "Transporte":
        return 0 // Transporte não tem mais notificações
      case "Suporte":
        return notifications.suporte || 0
      case "Subcontas":
        return notifications.subcontas || 0
      case "Planejamento":
        return notifications.viagens || 0
      case "Proof of Delivery":
        return notifications.viagens || 0
      default:
        return 0
    }
  }

  const getWmsNotificationCount = (subItems: any[], notifications: any) => {
    if (!notifications || !subItems) return 0
    
    return subItems.reduce((total, item) => {
      return total + getNotificationCount(item.label, notifications)
    }, 0)
  }

  const toggleExpanded = (itemPath: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemPath)) {
      newExpanded.delete(itemPath)
    } else {
      newExpanded.add(itemPath)
    }
    setExpandedItems(newExpanded)
  }

  // Convert regular paths to demo paths during tutorial
  const convertToTutorialPath = (path: string) => {
    if (!isTutorialActive) return path
    
    const demoRoutes = {
      '/': '/demo/dashboard',
      '/dashboard': '/demo/dashboard',
      '/entradas': '/demo/entradas',
      '/estoque': '/demo/estoque', 
      '/saidas': '/demo/saidas',
      '/recebimento': '/demo/recebimento'
    }
    
    return demoRoutes[path as keyof typeof demoRoutes] || path
  }

  return (
    <Sidebar className="w-56 lg:w-64" collapsible="offcanvas">
      <SidebarContent className="bg-gradient-card">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src={customLogo || logoImg} 
                alt="AgroHub" 
                className="w-8 h-8 object-contain" 
              />
            </div>
            <div>
              <h2 className="font-bold text-foreground">AgroHub</h2>
            </div>
          </div>
        </div>

        {/* Tutorial Button */}
        <div className="px-4 pb-2">
          <TutorialButton />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  {item.subItems ? (
                    // Item com submenu (WMS)
                    <>
                      <SidebarMenuButton 
                        onClick={() => toggleExpanded(item.path)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-secondary/50 cursor-pointer`}
                      >
                        <div className="relative">
                          {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                          {notifications && getWmsNotificationCount(item.subItems, notifications) > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs min-w-4"
                            >
                              {getWmsNotificationCount(item.subItems, notifications)}
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium flex-1">{item.label}</span>
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            expandedItems.has(item.path) ? 'rotate-90' : ''
                          }`} 
                        />
                      </SidebarMenuButton>
                      {expandedItems.has(item.path) && (
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.label}>
                              <SidebarMenuSubButton asChild>
                                <NavLink 
                                  to={convertToTutorialPath(subItem.path)}
                                  data-tutorial={subItem.label === "Recebimento" ? "menu-recebimento" : undefined}
                                  className={({ isActive }) => 
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(isActive)} relative`
                                  }
                                >
                                   <div className="relative">
                                    {subItem.icon && <subItem.icon className="w-4 h-4 flex-shrink-0" />}
                                    {notifications && getNotificationCount(subItem.label, notifications) > 0 && (
                                      <Badge 
                                        variant="destructive" 
                                        className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs min-w-4"
                                      >
                                        {getNotificationCount(subItem.label, notifications)}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-medium">{subItem.label}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    // Item normal sem submenu
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={convertToTutorialPath(item.path)} 
                         end={item.path === "/"}
                         data-tutorial={item.label === "Entradas" ? "entradas-link" : undefined}
                         className={({ isActive }) => 
                           `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(isActive)} relative`
                         }
                       >
                          <div className="relative">
                            {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                           {notifications && getNotificationCount(item.label, notifications) > 0 && (
                             <Badge 
                               variant="destructive" 
                               className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs min-w-4"
                             >
                               {getNotificationCount(item.label, notifications)}
                             </Badge>
                           )}
                         </div>
                          <span className="font-medium">{item.label}</span>
                       </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User menu at bottom */}
        <div className="mt-auto p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center gap-3 h-auto p-2 justify-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{displayName || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/suporte")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}