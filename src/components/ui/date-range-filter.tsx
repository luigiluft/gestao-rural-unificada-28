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
  const handleFromDateChange = (date: Date | undefined) => {
    onDateRangeChange({
      from: date,
      to: dateRange.to
    })
  }

  const handleToDateChange = (date: Date | undefined) => {
    onDateRangeChange({
      from: dateRange.from,
      to: date
    })
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Filtro por Período</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Inicial */}
          <div className="space-y-2">
            <Label htmlFor="data-inicial">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="data-inicial"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    format(dateRange.from, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione a data inicial</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={handleFromDateChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <Label htmlFor="data-final">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="data-final"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? (
                    format(dateRange.to, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione a data final</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={handleToDateChange}
                  disabled={(date) => {
                    return dateRange.from ? date < dateRange.from : false
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
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