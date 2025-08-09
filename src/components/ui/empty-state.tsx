import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        {icon && (
          <div className="mb-4 p-3 rounded-full bg-muted">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-gradient-primary hover:bg-primary/90">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}