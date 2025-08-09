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
  Users
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

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
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

const menuItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Entradas", url: "/entradas", icon: Package },
  { title: "Estoque", url: "/estoque", icon: PackageOpen },
  { title: "Saídas", url: "/saidas", icon: LogOut },
  { title: "Rastreio", url: "/rastreio", icon: MapPin },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Suporte", url: "/suporte", icon: HelpCircle },
  { title: "Perfil", url: "/perfil", icon: User },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const { user } = useAuth()
  const [displayName, setDisplayName] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
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
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false)
        return
      }
      try {
        const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
        if (!error && typeof data === 'boolean') {
          setIsAdmin(data)
          return
        }
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
        setIsAdmin(Array.isArray(roles) && roles.some((r: any) => r.role === 'admin'))
      } catch {
        setIsAdmin(false)
      }
    }
    checkAdmin()
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
  const items = (() => {
    const base = [...menuItems]
    if (isAdmin) {
      base.splice(6, 0,
        { title: "Usuários", url: "/usuarios", icon: User },
        { title: "Franqueados", url: "/franqueados", icon: Users },
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
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-foreground">AgroStock</h2>
                <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
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
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(isActive)}`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
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
                <p className="text-xs text-muted-foreground truncate">Fazenda São José</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}