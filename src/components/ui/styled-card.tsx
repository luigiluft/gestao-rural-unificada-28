import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const styledCardVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-lg hover:shadow-xl",
        glow: "shadow-elegant border-primary/20",
        gradient: "bg-gradient-subtle border-primary/30",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        scale: "hover:scale-[1.02]",
        glow: "hover:shadow-glow",
      },
      clickable: {
        true: "cursor-pointer select-none",
        false: "",
      },
      padding: {
        none: "[&>*]:p-0",
        sm: "[&>*]:p-4",
        default: "",
        lg: "[&>*]:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      clickable: false,
      padding: "default",
    },
  }
)

export interface StyledCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof styledCardVariants> {
  title?: string
  description?: string
  footer?: React.ReactNode
  children?: React.ReactNode
}

const StyledCard = React.forwardRef<HTMLDivElement, StyledCardProps>(
  ({ 
    className, 
    variant, 
    hover, 
    clickable, 
    padding,
    title, 
    description, 
    footer, 
    children, 
    ...props 
  }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          styledCardVariants({ variant, hover, clickable, padding }),
          className
        )}
        {...props}
      >
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        
        {children && (
          <CardContent>
            {children}
          </CardContent>
        )}
        
        {footer && (
          <CardFooter>
            {footer}
          </CardFooter>
        )}
      </Card>
    )
  }
)
StyledCard.displayName = "StyledCard"

export { StyledCard, styledCardVariants }