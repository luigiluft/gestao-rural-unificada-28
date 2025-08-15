import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useDepositosFranqueado } from "@/hooks/useDepositosDisponiveis"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export function GerenciarDepositosProdutor() {
  const { data: franquias } = useDepositosFranqueado()


  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de Franquias</CardTitle>
        <CardDescription>
          Sistema simplificado - Todos os produtores têm acesso automático às franquias ativas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900">Sistema Atualizado!</h3>
          <p className="text-sm text-blue-700 mt-2">
            O sistema foi simplificado. Agora todos os produtores têm acesso automático a todas as franquias ativas. 
            Não é mais necessário gerenciar autorizações individuais.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Suas Franquias Ativas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {franquias?.map((franquia) => (
              <Card key={franquia.id}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{franquia.nome}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {franquia.endereco && `${franquia.endereco} - `}
                    {franquia.cidade}, {franquia.estado}
                  </p>
                  <Badge variant="default" className="mt-2">
                    Ativa - Acesso Automático
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {(!franquias || franquias.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma franquia encontrada. Crie uma franquia para começar.
          </div>
        )}
      </CardContent>
    </Card>
  )
}