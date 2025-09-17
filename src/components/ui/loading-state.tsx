import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        skeleton: "",
        spinner: "",
        pulse: "",
        shimmer: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "skeleton",
      size: "default",
    },
  }
)

const spinnerSizes = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8",
}

const skeletonSizes = {
  sm: "h-4",
  default: "h-6",
  lg: "h-8",
}

export interface LoadingStateProps extends VariantProps<typeof loadingVariants> {
  lines?: number
  text?: string
  className?: string
  fullHeight?: boolean
}

export function LoadingState({
  variant = "skeleton",
  size = "default",
  lines = 3,
  text,
  className,
  fullHeight = false,
}: LoadingStateProps) {
  const containerClasses = cn(
    loadingVariants({ variant, size }),
    fullHeight && "min-h-[200px]",
    className
  )

  if (variant === "spinner") {
    return (
      <div className={containerClasses}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn(
            "animate-spin text-primary",
            spinnerSizes[size]
          )} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={containerClasses}>
        <div className="w-full space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-muted rounded-md animate-pulse",
                skeletonSizes[size],
                i === lines - 1 && "w-3/4" // Last line shorter
              )}
            />
          ))}
          {text && (
            <p className="text-sm text-muted-foreground text-center mt-4 animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (variant === "shimmer") {
    return (
      <div className={containerClasses}>
        <div className="w-full space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse",
                "bg-[length:200%_100%] animate-[shimmer_2s_infinite]",
                skeletonSizes[size],
                i === lines - 1 && "w-3/4"
              )}
              style={{
                animation: `shimmer 2s infinite linear`,
                backgroundImage: `linear-gradient(90deg, 
                  hsl(var(--muted)) 0%, 
                  hsl(var(--muted-foreground) / 0.1) 50%, 
                  hsl(var(--muted)) 100%)`,
              }}
            />
          ))}
          {text && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Default skeleton variant
  return (
    <div className={containerClasses}>
      <div className="w-full space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              skeletonSizes[size],
              i === lines - 1 && "w-3/4"
            )}
          />
        ))}
        {text && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}