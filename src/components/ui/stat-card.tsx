import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: "default" | "success" | "warning" | "destructive"
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-gradient-to-br from-success/5 to-success/10"
      case "warning":
        return "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10"
      case "destructive":
        return "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10"
      default:
        return "border-border bg-gradient-card"
    }
  }

  const getIconClasses = () => {
    switch (variant) {
      case "success":
        return "bg-success text-success-foreground"
      case "warning":
        return "bg-warning text-warning-foreground"
      case "destructive":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const getTrendClasses = () => {
    if (!trend) return ""
    return trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-elevated ${getVariantClasses()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${getIconClasses()}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={`text-xs mt-1 ${getTrendClasses()}`}>
            {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}