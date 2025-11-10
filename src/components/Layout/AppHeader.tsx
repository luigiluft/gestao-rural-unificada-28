import { useEffect, useState } from "react"
import { Search, Bell, ChevronDown, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import { getRoleLabel } from "@/utils/roleTranslations"

export function AppHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState<string>("")
  const [roleLabel, setRoleLabel] = useState<string>(getRoleLabel('produtor', false, true))
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
    const loadRole = async () => {
      if (!user) { 
        setRoleLabel(getRoleLabel('produtor', false, true))
        return 
      }
      try {
        const [adminRes, franqRes, motoristaRes] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'franqueado' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'motorista' }),
        ])
        const isAdmin = adminRes.data === true
        const isFranqueado = franqRes.data === true
        const isMotorista = motoristaRes.data === true
        
        if (isAdmin) setRoleLabel(getRoleLabel('admin', false, true))
        else if (isFranqueado) setRoleLabel(getRoleLabel('franqueado', false, true))
        else if (isMotorista) setRoleLabel(getRoleLabel('motorista', false, true))
        else setRoleLabel(getRoleLabel('produtor', false, true))
      } catch {
        setRoleLabel(getRoleLabel('produtor', false, true))
      }
    }
    loadRole()
  }, [user])

  const initials = (displayName || user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const { logout } = useAuth()

  const handleLogout = logout

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-card">
      {/* Left side - Menu toggle and Role indicator */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Visão:</span>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>
      </div>

    </header>
  )
}