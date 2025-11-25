import { useEffect, useState } from "react"
import { Search, Bell, ChevronDown, Settings, HelpCircle, Building2 } from "lucide-react"
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
import { useCliente } from "@/contexts/ClienteContext"
import { useClientes } from "@/hooks/useClientes"
import { useFranquia } from "@/contexts/FranquiaContext"

export function AppHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState<string>("")
  const [roleLabel, setRoleLabel] = useState<string>(getRoleLabel('produtor', false, true))
  const { selectedCliente, setSelectedCliente, availableClientes } = useCliente()
  const { data: clientes } = useClientes()
  const { selectedFranquia, setSelectedFranquia, availableFranquias } = useFranquia()
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

  // Sincronizar clientes disponíveis quando carregarem
  useEffect(() => {
    if (clientes && clientes.length > 0) {
      // Usar availableClientes do contexto não funciona na primeira carga
      // então sincronizamos direto quando os clientes chegam
    }
  }, [clientes])

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-card">
      {/* Left side - Menu toggle and Role indicator */}
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Visão:</span>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>

        {/* Empresa selector - only for cliente role */}
        {roleLabel === 'Cliente' && clientes && clientes.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>Empresa:</span>
              {clientes.length === 1 ? (
                <Badge variant="outline" className="font-normal">
                  {clientes[0].razao_social}
                </Badge>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      {selectedCliente?.razao_social || clientes[0].razao_social}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-card z-50">
                    <DropdownMenuLabel>Selecione a Empresa</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {clientes.map((cliente) => (
                      <DropdownMenuItem
                        key={cliente.id}
                        onClick={() => setSelectedCliente(cliente)}
                        className={selectedCliente?.id === cliente.id ? "bg-primary/10" : ""}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{cliente.razao_social}</span>
                          <span className="text-xs text-muted-foreground">
                            {cliente.tipo_cliente === 'cpf' ? 'CPF' : 'CNPJ'}: {cliente.cpf_cnpj}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}

        {/* Depósito selector - for franqueado/operador/produtor roles */}
        {(roleLabel === 'Franqueado' || roleLabel === 'Operador' || roleLabel === 'Cliente') && availableFranquias.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>Depósito:</span>
              {availableFranquias.length === 1 ? (
                <Badge variant="outline" className="font-normal">
                  {availableFranquias[0].nome}
                </Badge>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      {selectedFranquia?.nome || availableFranquias[0].nome}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-card z-50">
                    <DropdownMenuLabel>Selecione o Depósito</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableFranquias.map((franquia) => (
                      <DropdownMenuItem
                        key={franquia.id}
                        onClick={() => setSelectedFranquia(franquia)}
                        className={selectedFranquia?.id === franquia.id ? "bg-primary/10" : ""}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{franquia.nome}</span>
                          {franquia.cnpj && (
                            <span className="text-xs text-muted-foreground">
                              CNPJ: {franquia.cnpj}
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Info badge quando "Todos" está selecionado para operadores */}
            {(roleLabel === 'Franqueado' || roleLabel === 'Operador') && selectedFranquia?.id === 'ALL' && (
              <Badge variant="secondary" className="text-xs">
                Menu WMS oculto (visão consolidada)
              </Badge>
            )}
          </>
        )}
      </div>

    </header>
  )
}