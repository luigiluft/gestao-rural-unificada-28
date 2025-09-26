import * as React from "react"
import { cn } from "@/lib/utils"

const ResponsiveTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    variant?: "default" | "compact"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        variant === "compact" && "text-xs lg:text-sm",
        className
      )}
      {...props}
    />
  </div>
))
ResponsiveTable.displayName = "ResponsiveTable"

const ResponsiveTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
ResponsiveTableHeader.displayName = "ResponsiveTableHeader"

const ResponsiveTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
ResponsiveTableBody.displayName = "ResponsiveTableBody"

const ResponsiveTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
ResponsiveTableRow.displayName = "ResponsiveTableRow"

const ResponsiveTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    hideOn?: "mobile" | "tablet" | "desktop"
    minWidth?: string
  }
>(({ className, hideOn, minWidth, ...props }, ref) => {
  const hideClasses = {
    mobile: "hidden sm:table-cell",
    tablet: "hidden md:table-cell", 
    desktop: "hidden lg:table-cell"
  }

  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        hideOn && hideClasses[hideOn],
        minWidth && `min-w-[${minWidth}]`,
        className
      )}
      {...props}
    />
  )
})
ResponsiveTableHead.displayName = "ResponsiveTableHead"

const ResponsiveTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    hideOn?: "mobile" | "tablet" | "desktop"
    truncate?: boolean
    maxWidth?: string
  }
>(({ className, hideOn, truncate, maxWidth, ...props }, ref) => {
  const hideClasses = {
    mobile: "hidden sm:table-cell",
    tablet: "hidden md:table-cell",
    desktop: "hidden lg:table-cell"
  }

  return (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
        hideOn && hideClasses[hideOn],
        truncate && "truncate",
        maxWidth && `max-w-[${maxWidth}]`,
        className
      )}
      {...props}
    />
  )
})
ResponsiveTableCell.displayName = "ResponsiveTableCell"

export {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
}