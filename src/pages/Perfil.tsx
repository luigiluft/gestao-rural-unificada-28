import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

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
