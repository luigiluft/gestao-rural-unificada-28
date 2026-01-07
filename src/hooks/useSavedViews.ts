import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"
import type { Json } from "@/integrations/supabase/types"

export interface SavedView {
  id: string
  user_id: string
  table_name: string
  name: string
  description?: string
  columns: ColumnConfig[]
  column_widths: Record<string, number>
  column_order: string[]
  records_per_page: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreateViewInput {
  tableName: string
  name: string
  description?: string
  columns: ColumnConfig[]
  columnWidths: Record<string, number>
  columnOrder: string[]
  recordsPerPage: number
  isDefault?: boolean
}

export function useSavedViews(tableName: string) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch saved views for the user filtered by table
  const { data: savedViews = [], isLoading } = useQuery({
    queryKey: ["saved-views", user?.id, tableName],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from("user_saved_views")
        .select("id, user_id, table_name, name, description, columns, column_widths, column_order, records_per_page, is_default, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("table_name", tableName)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching saved views:", error)
        return []
      }

      // Parse the JSON fields
      return data.map(view => ({
        ...view,
        columns: (view.columns as unknown as ColumnConfig[]) || [],
        column_widths: (view.column_widths as Record<string, number>) || {},
        column_order: (view.column_order as unknown as string[]) || []
      })) as SavedView[]
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Create a new saved view
  const createViewMutation = useMutation({
    mutationFn: async (input: CreateViewInput) => {
      if (!user?.id) throw new Error("User not authenticated")

      // If setting as default, first unset any existing default
      if (input.isDefault) {
        await supabase
          .from("user_saved_views")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true)
      }

      const { data, error } = await supabase
        .from("user_saved_views")
        .insert({
          user_id: user.id,
          table_name: input.tableName,
          name: input.name,
          description: input.description,
          columns: input.columns as unknown as Json,
          column_widths: input.columnWidths as unknown as Json,
          column_order: input.columnOrder as unknown as Json,
          records_per_page: input.recordsPerPage,
          is_default: input.isDefault || false
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] })
      toast({
        title: "Visualização salva",
        description: "A visualização foi criada com sucesso."
      })
    },
    onError: (error) => {
      console.error("Error creating view:", error)
      toast({
        title: "Erro ao criar visualização",
        description: "Não foi possível criar a visualização.",
        variant: "destructive"
      })
    }
  })

  // Update an existing view
  const updateViewMutation = useMutation({
    mutationFn: async ({ id, ...input }: CreateViewInput & { id: string }) => {
      if (!user?.id) throw new Error("User not authenticated")

      // If setting as default, first unset any existing default
      if (input.isDefault) {
        await supabase
          .from("user_saved_views")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true)
          .neq("id", id)
      }

      const { error } = await supabase
        .from("user_saved_views")
        .update({
          name: input.name,
          description: input.description,
          columns: input.columns as unknown as Json,
          column_widths: input.columnWidths as unknown as Json,
          column_order: input.columnOrder as unknown as Json,
          records_per_page: input.recordsPerPage,
          is_default: input.isDefault || false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] })
      toast({
        title: "Visualização atualizada",
        description: "As alterações foram salvas com sucesso."
      })
    },
    onError: (error) => {
      console.error("Error updating view:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a visualização.",
        variant: "destructive"
      })
    }
  })

  // Delete a view
  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: string) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("user_saved_views")
        .delete()
        .eq("id", viewId)
        .eq("user_id", user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] })
      toast({
        title: "Visualização excluída",
        description: "A visualização foi removida com sucesso."
      })
    },
    onError: (error) => {
      console.error("Error deleting view:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a visualização.",
        variant: "destructive"
      })
    }
  })

  // Apply a saved view to current table columns
  const applyViewToColumns = (
    view: SavedView,
    defaultColumns: ColumnConfig[]
  ): { columns: ColumnConfig[]; columnWidths: Record<string, number>; recordsPerPage: number } => {
    // Create a map of view column visibility by key
    const viewVisibility = new Map(
      view.columns.map(col => [col.key, col.visible])
    )

    // Apply visibility to default columns (handles columns that exist in this table)
    const mergedColumns = defaultColumns.map(col => ({
      ...col,
      visible: viewVisibility.has(col.key) ? viewVisibility.get(col.key)! : col.visible
    }))

    // Reorder based on view's column order
    if (view.column_order && view.column_order.length > 0) {
      const orderedColumns: ColumnConfig[] = []
      
      for (const key of view.column_order) {
        const col = mergedColumns.find(c => c.key === key)
        if (col) orderedColumns.push(col)
      }
      
      // Add any columns from this table that weren't in the saved view
      for (const col of mergedColumns) {
        if (!view.column_order.includes(col.key)) {
          orderedColumns.push(col)
        }
      }
      
      return {
        columns: orderedColumns,
        columnWidths: view.column_widths || {},
        recordsPerPage: view.records_per_page || 10
      }
    }

    return {
      columns: mergedColumns,
      columnWidths: view.column_widths || {},
      recordsPerPage: view.records_per_page || 10
    }
  }

  return {
    savedViews,
    isLoading,
    createView: createViewMutation.mutate,
    updateView: updateViewMutation.mutate,
    deleteView: deleteViewMutation.mutate,
    applyViewToColumns,
    isCreating: createViewMutation.isPending,
    isUpdating: updateViewMutation.isPending,
    isDeleting: deleteViewMutation.isPending
  }
}
