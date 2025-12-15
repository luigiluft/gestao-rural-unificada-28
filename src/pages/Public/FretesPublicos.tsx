import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Truck, 
  Search, 
  MapPin,
  Calendar,
  DollarSign,
  Package,
  ArrowRight,
  Phone,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FretesPublicos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState<string>("");
  const [tipoCarga, setTipoCarga] = useState<string>("");

  // Mock data - será substituído por dados reais do Supabase
  const ofertas: any[] = [];

  const filteredOfertas = ofertas.filter(oferta => {
    const matchSearch = 
      oferta.origem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oferta.destino?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVeiculo = !tipoVeiculo || oferta.tipo_veiculo === tipoVeiculo;
    const matchCarga = !tipoCarga || oferta.tipo_carga === tipoCarga;
    return matchSearch && matchVeiculo && matchCarga && oferta.status === 'aberta';
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
              Fretes Disponíveis
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontre oportunidades de frete em todo o Brasil. 
              Consulte as ofertas disponíveis e entre em contato para negociar.
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por origem ou destino..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tipo Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="carreta">Carreta</SelectItem>
                  <SelectItem value="bitrem">Bitrem</SelectItem>
                  <SelectItem value="rodotrem">Rodotrem</SelectItem>
                  <SelectItem value="toco">Toco</SelectItem>
                  <SelectItem value="vuc">VUC</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoCarga} onValueChange={setTipoCarga}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tipo Carga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="granel">Granel</SelectItem>
                  <SelectItem value="sacaria">Sacaria</SelectItem>
                  <SelectItem value="paletizada">Paletizada</SelectItem>
                  <SelectItem value="frigorificada">Frigorificada</SelectItem>
                  <SelectItem value="geral">Carga Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredOfertas.length === 0 ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum frete disponível no momento
                </h3>
                <p className="text-muted-foreground">
                  Volte mais tarde para conferir novas oportunidades de frete.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOfertas.map((oferta) => (
                <Card key={oferta.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500">Disponível</Badge>
                      <span className="text-sm text-muted-foreground">
                        {oferta.created_at && format(new Date(oferta.created_at), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Route */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <div className="w-0.5 h-8 bg-border" />
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Origem</p>
                          <p className="font-medium">{oferta.origem}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Destino</p>
                          <p className="font-medium">{oferta.destino}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Coleta</p>
                          <p className="text-sm font-medium">
                            {oferta.data_coleta && format(new Date(oferta.data_coleta), "dd/MM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Peso</p>
                          <p className="text-sm font-medium">{oferta.peso?.toLocaleString()} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Veículo</p>
                          <p className="text-sm font-medium capitalize">{oferta.tipo_veiculo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Valor</p>
                          <p className="text-sm font-medium text-primary">
                            R$ {oferta.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cargo Type */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tipo de carga:</span>
                      <Badge variant="outline" className="capitalize">{oferta.tipo_carga}</Badge>
                    </div>

                    {/* CTA */}
                    <Button className="w-full" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Entrar em Contato
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Como funciona?</h2>
            <p className="mt-4 text-muted-foreground">
              É simples e rápido encontrar fretes disponíveis
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Busque</h3>
                <p className="text-muted-foreground">
                  Utilize os filtros para encontrar fretes compatíveis com seu veículo e região.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Contate</h3>
                <p className="text-muted-foreground">
                  Entre em contato com o embarcador para negociar valores e condições.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Transporte</h3>
                <p className="text-muted-foreground">
                  Feche o acordo e realize o transporte com segurança e pontualidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
