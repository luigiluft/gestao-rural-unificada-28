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

export function AppHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState<string>("")
  const [roleLabel, setRoleLabel] = useState<string>("Produtor")
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
      if (!user) { setRoleLabel("Produtor"); return }
      try {
        const [adminRes, franqRes] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'franqueado' }),
        ])
        const isAdmin = adminRes.data === true
        const isFranqueado = franqRes.data === true
        if (isAdmin) setRoleLabel('Admin')
        else if (isFranqueado) setRoleLabel('Franqueado')
        else setRoleLabel('Produtor')
      } catch {
        setRoleLabel('Produtor')
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
      {/* Left side - Sidebar trigger */}
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