import { useState } from "react"
import { LojaAnuncio, useLojaAnuncios } from "@/hooks/useLojaAnuncios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreVertical, Edit, Trash2, Eye, EyeOff, Package } from "lucide-react"
import { AnuncioForm } from "./AnuncioForm"

interface AnuncioCardProps {
  anuncio: LojaAnuncio
}

export function AnuncioCard({ anuncio }: AnuncioCardProps) {
  const { toggleAtivo, removerAnuncio, isRemovendo } = useLojaAnuncios()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const precoFinal = anuncio.preco_promocional || anuncio.preco_unitario
  const temDesconto = anuncio.preco_promocional && anuncio.preco_promocional < anuncio.preco_unitario

  return (
    <>
      <Card className={!anuncio.ativo ? "opacity-60" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Imagem placeholder */}
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {anuncio.imagens && anuncio.imagens.length > 0 ? (
                <img
                  src={anuncio.imagens[0]}
                  alt={anuncio.titulo}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium truncate">{anuncio.titulo}</h3>
                  {anuncio.categoria && (
                    <Badge variant="secondary" className="mt-1">
                      {anuncio.categoria}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEdit(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDelete(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  R$ {precoFinal.toFixed(2)}
                </span>
                {temDesconto && (
                  <span className="text-sm text-muted-foreground line-through">
                    R$ {anuncio.preco_unitario.toFixed(2)}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  /{anuncio.unidade_venda}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {anuncio.visivel_marketplace && (
                    <Badge variant="outline" className="text-xs">
                      Marketplace
                    </Badge>
                  )}
                  {anuncio.visivel_loja_propria && (
                    <Badge variant="outline" className="text-xs">
                      Loja
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {anuncio.ativo ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={anuncio.ativo}
                    onCheckedChange={(checked) => toggleAtivo({ id: anuncio.id, ativo: checked })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Anúncio</DialogTitle>
          </DialogHeader>
          <AnuncioForm
            anuncioParaEditar={{
              id: anuncio.id,
              titulo: anuncio.titulo,
              descricao_anuncio: anuncio.descricao_anuncio || undefined,
              preco_unitario: anuncio.preco_unitario,
              preco_promocional: anuncio.preco_promocional || undefined,
              unidade_venda: anuncio.unidade_venda,
              quantidade_minima: anuncio.quantidade_minima,
              quantidade_disponivel: anuncio.quantidade_disponivel || undefined,
              visivel_marketplace: anuncio.visivel_marketplace,
              visivel_loja_propria: anuncio.visivel_loja_propria,
              categoria: anuncio.categoria || undefined,
            }}
            onSuccess={() => setShowEdit(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Anúncio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o anúncio "{anuncio.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removerAnuncio(anuncio.id)}
              disabled={isRemovendo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovendo ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
