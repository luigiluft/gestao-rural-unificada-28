import { useState, useEffect, useCallback } from "react"
import { toast } from "@/hooks/use-toast"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
  category?: string
}

export interface TableStateConfig {
  storageKey: string
  defaultColumns: ColumnConfig[]
  defaultRecordsPerPage?: number
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export const useTableState = (config: TableStateConfig) => {
  const { storageKey, defaultColumns, defaultRecordsPerPage = 10 } = config

  // Column state
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(defaultRecordsPerPage)

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  })

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(storageKey)
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        if (parsed.columns) {
          setColumns(parsed.columns)
        }
        if (parsed.columnWidths) {
          setColumnWidths(parsed.columnWidths)
        }
        if (parsed.recordsPerPage) {
          setRecordsPerPage(parsed.recordsPerPage)
        }
      } catch (error) {
        console.error('Failed to load table configuration:', error)
      }
    }
  }, [storageKey])

  // Save configuration to localStorage
  const saveTableView = useCallback(() => {
    const config = {
      columns,
      columnWidths,
      recordsPerPage
    }
    localStorage.setItem(storageKey, JSON.stringify(config))
    toast({
      title: "Visualização salva",
      description: "As configurações da tabela foram salvas com sucesso."
    })
  }, [columns, columnWidths, recordsPerPage, storageKey])

  // Reset to default configuration
  const resetToDefault = useCallback(() => {
    setColumns(defaultColumns)
    setColumnWidths({})
    setRecordsPerPage(defaultRecordsPerPage)
    localStorage.removeItem(storageKey)
    toast({
      title: "Configurações restauradas",
      description: "A tabela foi restaurada para as configurações padrão."
    })
  }, [defaultColumns, defaultRecordsPerPage, storageKey])

  // Column visibility handlers
  const handleColumnVisibilityChange = useCallback((columnKey: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible } : col
    ))
  }, [])

  // Column reordering handler
  const handleColumnReorder = useCallback((newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }, [])

  // Column width handler
  const handleColumnWidthChange = useCallback((columnKey: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [columnKey]: width }))
  }, [])

  // Mouse down handler for column resizing
  const handleMouseDown = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = columnWidths[columnKey] || 120
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX))
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }))
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      saveTableView()
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [columnWidths, saveTableView])

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleRecordsPerPageChange = useCallback((records: number) => {
    setRecordsPerPage(records)
    setCurrentPage(1) // Reset to first page when changing records per page
  }, [])

  return {
    // State
    columns,
    columnWidths,
    currentPage,
    recordsPerPage,
    dateRange,

    // Setters
    setColumns,
    setColumnWidths,
    setCurrentPage,
    setRecordsPerPage,
    setDateRange,

    // Handlers
    handleColumnVisibilityChange,
    handleColumnReorder,
    handleColumnWidthChange,
    handlePageChange,
    handleRecordsPerPageChange,
    handleMouseDown,

    // Actions
    saveTableView,
    resetToDefault
  }
}