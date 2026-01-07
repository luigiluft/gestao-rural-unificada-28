import { useState } from "react"
import { LayoutGrid, Star, Trash2, Plus, Check, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSavedViews, SavedView, CreateViewInput } from "@/hooks/useSavedViews"
import type { ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SavedViewsSelectorProps {
  tableName: string
  currentColumns: ColumnConfig[]
  currentColumnWidths: Record<string, number>
  currentRecordsPerPage: number
  defaultColumns: ColumnConfig[]
  activeViewId?: string | null
  onApplyView: (columns: ColumnConfig[], columnWidths: Record<string, number>, recordsPerPage: number, viewId: string) => void
  onClearView: () => void
}

export function SavedViewsSelector({
  tableName,
  currentColumns,
  currentColumnWidths,
  currentRecordsPerPage,
  defaultColumns,
  activeViewId,
  onApplyView,
  onClearView
}: SavedViewsSelectorProps) {
  const { savedViews, isLoading, createView, updateView, deleteView, applyViewToColumns, isCreating } = useSavedViews(tableName)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [viewToDelete, setViewToDelete] = useState<SavedView | null>(null)

  const activeView = savedViews.find(v => v.id === activeViewId)

  const handleSaveCurrentView = () => {
    if (!newViewName.trim()) return

    const input: CreateViewInput = {
      tableName,
      name: newViewName.trim(),
      columns: currentColumns,
      columnWidths: currentColumnWidths,
      columnOrder: currentColumns.map(c => c.key),
      recordsPerPage: currentRecordsPerPage,
      isDefault: setAsDefault
    }

    createView(input, {
      onSuccess: () => {
        setNewViewName("")
        setSetAsDefault(false)
        setIsCreatingNew(false)
      }
    })
  }

  const handleApplyView = (view: SavedView) => {
    const { columns, columnWidths, recordsPerPage } = applyViewToColumns(view, defaultColumns)
    onApplyView(columns, columnWidths, recordsPerPage, view.id)
    setIsOpen(false)
  }

  const handleDeleteView = (view: SavedView) => {
    setViewToDelete(view)
  }

  const confirmDelete = () => {
    if (viewToDelete) {
      deleteView(viewToDelete.id)
      if (activeViewId === viewToDelete.id) {
        onClearView()
      }
      setViewToDelete(null)
    }
  }

  const handleUpdateCurrentView = () => {
    if (!activeView) return

    updateView({
      id: activeView.id,
      tableName,
      name: activeView.name,
      description: activeView.description,
      columns: currentColumns,
      columnWidths: currentColumnWidths,
      columnOrder: currentColumns.map(c => c.key),
      recordsPerPage: currentRecordsPerPage,
      isDefault: activeView.is_default
    })
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            {activeView ? (
              <span className="flex items-center gap-1">
                {activeView.name}
                {activeView.is_default && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              </span>
            ) : (
              "Visualizações"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Visualizações Salvas</h4>
            <p className="text-xs text-muted-foreground">Específicas para esta tabela</p>
          </div>

          <ScrollArea className="max-h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : savedViews.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma visualização salva
              </div>
            ) : (
              <div className="p-1">
                {savedViews.map(view => (
                  <div
                    key={view.id}
                    className={`flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group ${
                      activeViewId === view.id ? "bg-muted" : ""
                    }`}
                  >
                    <button
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => handleApplyView(view)}
                    >
                      {activeViewId === view.id && <Check className="h-4 w-4 text-primary" />}
                      <span className="text-sm truncate">{view.name}</span>
                      {view.is_default && (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteView(view)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {isCreatingNew ? (
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="view-name" className="text-xs">Nome da visualização</Label>
                <Input
                  id="view-name"
                  placeholder="Ex: Minha visualização completa"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="h-8"
                  autoFocus
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="set-default"
                  checked={setAsDefault}
                  onCheckedChange={(checked) => setSetAsDefault(checked === true)}
                />
                <Label htmlFor="set-default" className="text-xs cursor-pointer">
                  Definir como padrão
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreatingNew(false)
                    setNewViewName("")
                    setSetAsDefault(false)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSaveCurrentView}
                  disabled={!newViewName.trim() || isCreating}
                >
                  {isCreating ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setIsCreatingNew(true)}
              >
                <Plus className="h-4 w-4" />
                Salvar visualização atual
              </Button>
              {activeView && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleUpdateCurrentView}
                >
                  <Pencil className="h-4 w-4" />
                  Atualizar "{activeView.name}"
                </Button>
              )}
              {activeViewId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => {
                    onClearView()
                    setIsOpen(false)
                  }}
                >
                  Limpar seleção
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!viewToDelete} onOpenChange={() => setViewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir visualização?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a visualização "{viewToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
