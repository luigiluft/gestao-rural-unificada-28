import { LojaPedido, useLojaPedidos } from "@/hooks/useLojaPedidos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Package, MapPin, Phone, Mail, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PedidoCardProps {
  pedido: LojaPedido
}

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { value: "em_separacao", label: "Em Separação", color: "bg-purple-100 text-purple-800" },
  { value: "enviado", label: "Enviado", color: "bg-orange-100 text-orange-800" },
  { value: "entregue", label: "Entregue", color: "bg-green-100 text-green-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
]

export function PedidoCard({ pedido }: PedidoCardProps) {
  const { atualizarStatus, isAtualizando } = useLojaPedidos()

  const statusInfo = STATUS_OPTIONS.find((s) => s.value === pedido.status) || STATUS_OPTIONS[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {pedido.numero_pedido}
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(pedido.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              R$ {pedido.valor_total.toFixed(2)}
            </p>
            {pedido.origem && (
              <Badge variant="outline" className="mt-1">
                {pedido.origem === "marketplace" ? "Marketplace" : "Loja Própria"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Itens do pedido */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Itens do Pedido
          </h4>
          <div className="space-y-1 text-sm">
            {pedido.itens?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.quantidade}x {item.anuncio?.titulo || "Produto"}
                </span>
                <span className="font-medium">
                  R$ {item.valor_total.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          {pedido.valor_frete > 0 && (
            <div className="flex justify-between text-sm pt-1 border-t">
              <span className="text-muted-foreground">Frete</span>
              <span>R$ {pedido.valor_frete.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Cliente */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Cliente</h4>
          <div className="text-sm space-y-1">
            <p className="font-medium">{pedido.comprador_nome}</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              {pedido.comprador_email}
            </p>
            {pedido.comprador_telefone && (
              <p className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {pedido.comprador_telefone}
              </p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço de Entrega
          </h4>
          <p className="text-sm text-muted-foreground">
            {pedido.endereco_entrega.logradouro}, {pedido.endereco_entrega.numero}
            {pedido.endereco_entrega.complemento && ` - ${pedido.endereco_entrega.complemento}`}
            <br />
            {pedido.endereco_entrega.bairro} - {pedido.endereco_entrega.cidade}/{pedido.endereco_entrega.estado}
            <br />
            CEP: {pedido.endereco_entrega.cep}
          </p>
        </div>

        {pedido.observacoes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Observações</h4>
              <p className="text-sm text-muted-foreground">{pedido.observacoes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status:</span>
            <Select
              value={pedido.status}
              onValueChange={(value) => atualizarStatus({ pedidoId: pedido.id, status: value })}
              disabled={isAtualizando}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
