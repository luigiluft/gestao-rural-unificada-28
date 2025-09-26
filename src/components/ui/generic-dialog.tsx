import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const dialogVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        destructive: "[&_.dialog-content]:border-destructive/50",
      },
      size: {
        sm: "[&_.dialog-content]:max-w-sm",
        default: "[&_.dialog-content]:max-w-lg",
        lg: "[&_.dialog-content]:max-w-2xl",
        xl: "[&_.dialog-content]:max-w-4xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface GenericDialogProps extends VariantProps<typeof dialogVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  disabled?: boolean
  hideFooter?: boolean
  className?: string
}

export function GenericDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  disabled = false,
  hideFooter = false,
  variant,
  size,
  className,
}: GenericDialogProps) {
  const handleConfirm = async () => {
    if (onConfirm && !isLoading && !disabled) {
      await onConfirm()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          dialogVariants({ variant, size }),
          "dialog-content",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(
            variant === "destructive" && "text-destructive"
          )}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        {!hideFooter && (onConfirm || onCancel) && (
          <DialogFooter className="gap-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={isLoading || disabled}
                className={cn(
                  variant === "default" && "bg-gradient-primary hover:bg-primary/90"
                )}
              >
                {isLoading ? "Processando..." : confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}