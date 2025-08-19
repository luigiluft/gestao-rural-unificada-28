import { useEffect, useState } from "react"
import {
  BarChart3,
  Package,
  PackageOpen,
  LogOut,
  MapPin,
  FileText,
  HelpCircle,
  User,
  Users,
  Boxes,
  Tractor,
  UserCheck,
  Building2,
  TreePine,
  CheckCircle
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import logoSvg from "@/assets/agrohub-logo.svg"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNotifications } from "@/hooks/useNotifications"

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Catálogo", url: "/catalogo", icon: Boxes },
  { title: "Entradas", url: "/entradas", icon: Package },
  { title: "Estoque", url: "/estoque", icon: PackageOpen },
  { title: "Saídas", url: "/saidas", icon: LogOut },
  { title: "Rastreio", url: "/rastreio", icon: MapPin },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Perfil", url: "/perfil", icon: User },
  { title: "Subcontas", url: "/subcontas", icon: UserCheck },
  { title: "Suporte", url: "/suporte", icon: HelpCircle },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const { user } = useAuth()
  const [displayName, setDisplayName] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isFranqueado, setIsFranqueado] = useState(false)
  const [isProdutor, setIsProdutor] = useState(false)
  
  const { data: notifications } = useNotifications()
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
  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false)
        setIsFranqueado(false)
        setIsProdutor(false)
        return
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        if (profile?.role) {
          setIsAdmin(profile.role === 'admin')
          setIsFranqueado(profile.role === 'franqueado')
          setIsProdutor(profile.role === 'produtor')
        } else {
          setIsAdmin(false)
          setIsFranqueado(false)
          setIsProdutor(false)
        }
      } catch {
        setIsAdmin(false)
        setIsFranqueado(false)
        setIsProdutor(false)
      }
    }
    checkRoles()
  }, [user])

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

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
      case "Expedição":
        return notifications.expedicao || 0
      case "Suporte":
        return notifications.suporte || 0
      case "Subcontas":
        return notifications.subcontas || 0
      default:
        return 0
    }
  }
  const items = (() => {
    const base = [...menuItems]
    if (isAdmin) {
      // Add "Recebimento" right after "Entradas" (index 3)
      base.splice(3, 0, { title: "Recebimento", url: "/recebimento", icon: CheckCircle })
      // Add "Expedição" after "Saídas" (index 5, accounting for the inserted item)
      base.splice(6, 0, { title: "Expedição", url: "/expedicao", icon: CheckCircle })
      // Add other admin items later in the menu
      base.splice(9, 0,
        { title: "Usuários", url: "/usuarios", icon: User },
        { title: "Franquias", url: "/franquias", icon: Building2 },
        { title: "Franqueados", url: "/franqueados", icon: Users },
        { title: "Produtores", url: "/produtores", icon: Tractor },
      )
    } else if (isFranqueado) {
      // Add "Recebimento" right after "Entradas" (index 3)
      base.splice(3, 0, { title: "Recebimento", url: "/recebimento", icon: CheckCircle })
      // Add "Expedição" after "Saídas" (index 5, accounting for the inserted item)
      base.splice(6, 0, { title: "Expedição", url: "/expedicao", icon: CheckCircle })
      // Add other franqueado items later in the menu
      base.splice(9, 0,
        { title: "Produtores", url: "/produtores", icon: Tractor },
      )
    } else if (isProdutor) {
      base.splice(7, 0,
        { title: "Fazendas", url: "/fazendas", icon: TreePine },
      )
    }
    return base
  })()

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-gradient-card">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={logoSvg} alt="AgroHub" className="w-8 h-8" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-foreground">AgroHub</h2>
                <p className="text-xs text-muted-foreground">Gestão Rural Inteligente</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                       to={item.url} 
                       end={item.url === "/"}
                       className={({ isActive }) => 
                         `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(isActive)} relative`
                       }
                     >
                       <div className="relative">
                         <item.icon className="w-5 h-5 flex-shrink-0" />
                         {notifications && getNotificationCount(item.title, notifications) > 0 && (
                           <Badge 
                             variant="destructive" 
                             className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs min-w-4"
                           >
                             {getNotificationCount(item.title, notifications)}
                           </Badge>
                         )}
                       </div>
                       {!collapsed && <span className="font-medium">{item.title}</span>}
                     </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User info at bottom */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName || "Usuário"}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}