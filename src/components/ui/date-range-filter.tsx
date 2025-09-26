import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangeFilterProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  className?: string
}

export function DateRangeFilter({ dateRange, onDateRangeChange, className }: DateRangeFilterProps) {
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      onDateRangeChange(range)
    } else {
      onDateRangeChange({ from: undefined, to: undefined })
    }
  }

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
    } else if (dateRange.from) {
      return `A partir de ${format(dateRange.from, "dd/MM/yyyy")}`
    } else if (dateRange.to) {
      return `Até ${format(dateRange.to, "dd/MM/yyyy")}`
    }
    return "Selecione o período"
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Filtro por Período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de Período Unificado */}
        <div className="space-y-2">
          <Label htmlFor="data-range">Período</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="data-range"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Botões de Atalho */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hoje = new Date()
              const seteDiasAtras = new Date()
              seteDiasAtras.setDate(hoje.getDate() - 7)
              onDateRangeChange({ from: seteDiasAtras, to: hoje })
            }}
          >
            Últimos 7 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hoje = new Date()
              const trintaDiasAtras = new Date()
              trintaDiasAtras.setDate(hoje.getDate() - 30)
              onDateRangeChange({ from: trintaDiasAtras, to: hoje })
            }}
          >
            Últimos 30 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const hoje = new Date()
              const noventaDiasAtras = new Date()
              noventaDiasAtras.setDate(hoje.getDate() - 90)
              onDateRangeChange({ from: noventaDiasAtras, to: hoje })
            }}
          >
            Últimos 90 dias
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
          >
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}