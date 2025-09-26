import { useQuery } from "@tanstack/react-query"

// Temporary hook returning empty data until ocorrencias table is properly created
export const useOcorrencias = (filters?: { status?: string; tipo?: string }) => {
  return useQuery({
    queryKey: ["ocorrencias", filters],
    queryFn: async () => {
      // Return empty array until table is created
      return []
    },
    staleTime: 30000,
  })
}