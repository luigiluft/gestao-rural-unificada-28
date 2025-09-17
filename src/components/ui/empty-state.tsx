import { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Search, Shield, FileX } from "lucide-react"
import { cn } from "@/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        "no-data": "",
        "error": "text-destructive",
        "search-empty": "",
        "permission-denied": "text-muted-foreground",
      },
      size: {
        sm: "py-8",
        default: "py-16",
        lg: "py-24",
      },
    },
    defaultVariants: {
      variant: "no-data",
      size: "default",
    },
  }
)

const defaultIcons = {
  "no-data": FileX,
  "error": AlertCircle,
  "search-empty": Search,
  "permission-denied": Shield,
}

export interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  illustration?: ReactNode
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  illustration,
  variant = "no-data",
  size = "default",
  className 
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[variant]
  const displayIcon = icon || (DefaultIcon && <DefaultIcon className="h-8 w-8" />)

  return (
    <Card className={cn("shadow-card", className)}>
      <CardContent className={cn(emptyStateVariants({ variant, size }))}>
        {illustration ? (
          <div className="mb-6">
            {illustration}
          </div>
        ) : displayIcon ? (
          <div className={cn(
            "mb-4 p-3 rounded-full",
            variant === "error" ? "bg-destructive/10" : "bg-muted"
          )}>
            {displayIcon}
          </div>
        ) : null}
        
        <h3 className={cn(
          "text-lg font-semibold mb-2",
          variant === "error" ? "text-destructive" : "text-foreground"
        )}>
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        {action && (
          <Button 
            onClick={action.onClick} 
            variant={action.variant || "default"}
            className={cn(
              !action.variant && "bg-gradient-primary hover:bg-primary/90"
            )}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}