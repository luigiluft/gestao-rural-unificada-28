import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { Link } from "react-router-dom"

export default function Perfil() {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
  })

  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email, telefone, cpf_cnpj")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Erro ao carregar perfil:", error)
        toast.error("Erro ao carregar perfil")
        return
      }

      setProfile({
        nome: data.nome || "",
        email: data.email || "",
        telefone: data.telefone || "",
        cpf_cnpj: data.cpf_cnpj || "",
      })
    }

    loadProfile()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user.id)

    setIsSaving(false)

    if (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro ao salvar perfil")
      return
    }

    toast.success("Perfil atualizado com sucesso!")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Gerenciar Clientes</h2>
            <p className="text-sm text-muted-foreground">
              Os dados de empresa foram movidos para Clientes (entidades fiscais)
            </p>
          </div>
        </div>
        <Link to="/clientes">
          <Button className="w-full">
            <Building2 className="mr-2 h-4 w-4" />
            Ir para Gerenciar Clientes
          </Button>
        </Link>
      </Card>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Meus Dados Pessoais</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={profile.nome}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="cpf_cnpj">CPF *</Label>
            <Input
              id="cpf_cnpj"
              value={profile.cpf_cnpj}
              onChange={(e) => setProfile({ ...profile, cpf_cnpj: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
