import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Plus, 
  Search, 
  Phone, 
  Mail,
  Truck,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function Autonomos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock data - será substituído por dados reais do Supabase
  const autonomos: any[] = [];

  const filteredAutonomos = autonomos.filter(autonomo =>
    autonomo.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    autonomo.cpf?.includes(searchTerm) ||
    autonomo.telefone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Autônomos</h1>
          <p className="text-muted-foreground">Gerencie motoristas autônomos cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Autônomo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Autônomo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" placeholder="Nome do autônomo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" placeholder="000.000.000-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnh">CNH</Label>
                  <Input id="cnh" placeholder="Número da CNH" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria_cnh">Categoria CNH</Label>
                  <Input id="categoria_cnh" placeholder="Ex: E" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rntrc">RNTRC</Label>
                  <Input id="rntrc" placeholder="Número do RNTRC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa do Veículo</Label>
                  <Input id="placa" placeholder="ABC-1234" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setDialogOpen(false)}>
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lista de Autônomos
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar autônomo..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAutonomos.length === 0 ? (
            <EmptyState
              icon={<User className="h-8 w-8" />}
              title="Nenhum autônomo cadastrado"
              description="Cadastre motoristas autônomos para ofertar fretes disponíveis."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CNH</TableHead>
                  <TableHead>RNTRC</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAutonomos.map((autonomo) => (
                  <TableRow key={autonomo.id}>
                    <TableCell className="font-medium">{autonomo.nome}</TableCell>
                    <TableCell>{autonomo.cpf}</TableCell>
                    <TableCell>{autonomo.telefone}</TableCell>
                    <TableCell>{autonomo.cnh}</TableCell>
                    <TableCell>{autonomo.rntrc}</TableCell>
                    <TableCell>{autonomo.placa}</TableCell>
                    <TableCell>
                      <Badge variant={autonomo.ativo ? "default" : "secondary"}>
                        {autonomo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
