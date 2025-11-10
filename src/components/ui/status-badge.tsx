import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Pause, 
  Play,
  ArrowRight,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "",
        success: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        error: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        pending: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        processing: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
      animated: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animated: false,
    },
  }
)

// Status mappings for automatic variant selection
const statusMappings: Record<string, {
  variant: "success" | "warning" | "error" | "info" | "pending" | "processing"
  icon?: LucideIcon
  label?: string
}> = {
  // Generic statuses
  "active": { variant: "success", icon: CheckCircle },
  "inactive": { variant: "pending", icon: Pause },
  "pending": { variant: "pending", icon: Clock },
  "processing": { variant: "processing", icon: Play },
  "completed": { variant: "success", icon: CheckCircle },
  "failed": { variant: "error", icon: XCircle },
  "cancelled": { variant: "error", icon: XCircle },
  "warning": { variant: "warning", icon: AlertTriangle },
  
  // Entry statuses
  "aguardando_aprovacao": { variant: "pending", icon: Clock, label: "Aguardando Aprovação" },
  "aprovado": { variant: "success", icon: CheckCircle, label: "Aprovado" },
  "rejeitado": { variant: "error", icon: XCircle, label: "Rejeitado" },
  "em_andamento": { variant: "processing", icon: ArrowRight, label: "Em Andamento" },
  "finalizado": { variant: "success", icon: CheckCircle, label: "Finalizado" },
  
  // User roles (using UI labels - backend uses 'franqueado'/'produtor')
  "admin": { variant: "info", label: "Administrador" },
  "franqueado": { variant: "success", label: "Operador" },
  "produtor": { variant: "warning", label: "Cliente" },
  "funcionario": { variant: "pending", label: "Funcionário" },
}

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: string
  type?: "generic" | "entry" | "user" | "custom"
  icon?: LucideIcon | React.ReactNode
  label?: string
  className?: string
  pulse?: boolean
}

export function StatusBadge({
  status,
  type = "generic",
  icon,
  label,
  variant,
  size,
  animated,
  className,
  pulse = false,
}: StatusBadgeProps) {
  // Get automatic mapping if no explicit variant provided
  const mapping = statusMappings[status.toLowerCase()]
  const finalVariant = variant || mapping?.variant || "default"
  const finalIcon = icon || mapping?.icon
  const finalLabel = label || mapping?.label || status

  const IconComponent = typeof finalIcon === "function" ? finalIcon : null
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"

  return (
    <Badge 
      className={cn(
        statusBadgeVariants({ variant: finalVariant, size, animated }),
        pulse && "animate-pulse",
        animated && finalVariant === "processing" && "animate-[pulse_2s_infinite]",
        className
      )}
    >
      {IconComponent && (
        <IconComponent className={cn(iconSize, "flex-shrink-0")} />
      )}
      {typeof finalIcon === "object" && finalIcon}
      <span className="truncate">{finalLabel}</span>
    </Badge>
  )
}

// Helper function for quick status creation
export function createStatusBadge(
  status: string, 
  options?: Omit<StatusBadgeProps, "status">
) {
  return <StatusBadge status={status} {...options} />
}