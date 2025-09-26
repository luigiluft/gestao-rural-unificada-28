import { useState } from "react"
import { Settings2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  category?: string
}

interface ColumnVisibilityControlProps {
  columns: ColumnConfig[]
  onVisibilityChange: (columnKey: string, visible: boolean) => void
  onResetDefault: () => void
}

export const ColumnVisibilityControl = ({
  columns,
  onVisibilityChange,
  onResetDefault,
}: ColumnVisibilityControlProps) => {
  const [open, setOpen] = useState(false)
  
  // Group columns by category
  const groupedColumns = columns.reduce((acc, column) => {
    const category = column.category || "Geral"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(column)
    return acc
  }, {} as Record<string, ColumnConfig[]>)

  const visibleCount = columns.filter(col => col.visible).length
  const totalCount = columns.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Colunas ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Visibilidade das Colunas</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetDefault}
              className="h-8 px-2 text-xs"
            >
              Padrão
            </Button>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {Object.entries(groupedColumns).map(([category, categoryColumns]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">
                    {category}
                  </h5>
                  <div className="space-y-1.5">
                    {categoryColumns.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={column.key}
                          checked={column.visible}
                          onCheckedChange={(checked) => 
                            onVisibilityChange(column.key, !!checked)
                          }
                        />
                        <Label 
                          htmlFor={column.key}
                          className="text-sm cursor-pointer flex items-center gap-1"
                        >
                          {column.visible ? (
                            <Eye className="h-3 w-3 text-green-600" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                          {column.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {Object.keys(groupedColumns).indexOf(category) < Object.keys(groupedColumns).length - 1 && (
                    <Separator />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}