import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { ColumnConfig } from "@/components/Entradas/ColumnVisibilityControl"
import type { Json } from "@/integrations/supabase/types"

interface TablePreferences {
  columns: ColumnConfig[]
  columnWidths: Record<string, number>
  columnOrder: string[]
  recordsPerPage: number
}

interface UseTablePreferencesOptions {
  tableName: string
  defaultColumns: ColumnConfig[]
  defaultRecordsPerPage?: number
}

export function useTablePreferences({
  tableName,
  defaultColumns,
  defaultRecordsPerPage = 10
}: UseTablePreferencesOptions) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch preferences from database
  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ["table-preferences", tableName, user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from("user_table_preferences")
        .select("*")
        .eq("user_id", user.id)
        .eq("table_name", tableName)
        .maybeSingle()

      if (error) {
        console.error("Error fetching table preferences:", error)
        return null
      }

      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Parse saved preferences
  const getPreferences = (): TablePreferences => {
    if (!savedPreferences) {
      return {
        columns: defaultColumns,
        columnWidths: {},
        columnOrder: defaultColumns.map(col => col.key),
        recordsPerPage: defaultRecordsPerPage
      }
    }

    // Merge saved columns with defaults (handle new columns that weren't saved)
    const savedColumns = savedPreferences.columns as unknown as ColumnConfig[] | null
    const savedOrder = savedPreferences.column_order as unknown as string[] | null
    
    let mergedColumns = defaultColumns
    
    if (savedColumns && Array.isArray(savedColumns)) {
      // Create a map of saved column visibility
      const savedVisibility = new Map(
        savedColumns.map(col => [col.key, col.visible])
      )
      
      // Apply saved visibility to default columns
      mergedColumns = defaultColumns.map(col => ({
        ...col,
        visible: savedVisibility.has(col.key) ? savedVisibility.get(col.key)! : col.visible
      }))
      
      // Reorder based on saved order
      if (savedOrder && Array.isArray(savedOrder)) {
        const orderedColumns: ColumnConfig[] = []
        
        for (const key of savedOrder) {
          const col = mergedColumns.find(c => c.key === key)
          if (col) orderedColumns.push(col)
        }
        
        // Add any new columns that weren't in saved order
        for (const col of mergedColumns) {
          if (!savedOrder.includes(col.key)) {
            orderedColumns.push(col)
          }
        }
        
        mergedColumns = orderedColumns
      }
    }

    return {
      columns: mergedColumns,
      columnWidths: (savedPreferences.column_widths as Record<string, number>) || {},
      columnOrder: savedOrder || mergedColumns.map(col => col.key),
      recordsPerPage: savedPreferences.records_per_page || defaultRecordsPerPage
    }
  }

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: TablePreferences) => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("user_table_preferences")
        .upsert({
          user_id: user.id,
          table_name: tableName,
          columns: preferences.columns as unknown as Json,
          column_widths: preferences.columnWidths as unknown as Json,
          column_order: preferences.columnOrder as unknown as Json,
          records_per_page: preferences.recordsPerPage,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,table_name'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-preferences", tableName] })
      toast({
        title: "Visualização salva",
        description: "As configurações da tabela foram salvas com sucesso."
      })
    },
    onError: (error) => {
      console.error("Error saving table preferences:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações da tabela.",
        variant: "destructive"
      })
    }
  })

  // Reset preferences mutation
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("user_table_preferences")
        .delete()
        .eq("user_id", user.id)
        .eq("table_name", tableName)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-preferences", tableName] })
      toast({
        title: "Visualização resetada",
        description: "As configurações da tabela foram restauradas ao padrão."
      })
    },
    onError: (error) => {
      console.error("Error resetting table preferences:", error)
    }
  })

  return {
    preferences: getPreferences(),
    isLoading,
    savePreferences: savePreferencesMutation.mutate,
    resetPreferences: resetPreferencesMutation.mutate,
    isSaving: savePreferencesMutation.isPending
  }
}
