import { Card, CardContent } from "@/components/ui/card"

interface ProgressIndicatorProps {
  currentIndex: number
  totalItems: number
}

export function ProgressIndicator({ currentIndex, totalItems }: ProgressIndicatorProps) {
  const progress = ((currentIndex + 1) / totalItems) * 100

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Progresso da Alocação
          </span>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} de {totalItems}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 mt-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}