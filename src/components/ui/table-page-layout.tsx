import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TablePageLayoutProps {
  title: string
  description?: string
  actionButton?: React.ReactNode
  filterSection?: React.ReactNode
  columnControlSection?: React.ReactNode
  tableContent: React.ReactNode
  className?: string
}

export const TablePageLayout: React.FC<TablePageLayoutProps> = ({
  title,
  description,
  actionButton,
  filterSection,
  columnControlSection,
  tableContent,
  className
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {actionButton}
      </div>

      {/* Filter Section */}
      {filterSection && (
        <Card>
          <CardContent className="p-4">
            {filterSection}
          </CardContent>
        </Card>
      )}

      {/* Column Control Section */}
      {columnControlSection && (
        <Card>
          <CardContent className="p-4">
            {columnControlSection}
          </CardContent>
        </Card>
      )}

      {/* Table Content */}
      <Card>
        <CardContent className="p-0">
          {tableContent}
        </CardContent>
      </Card>
    </div>
  )
}