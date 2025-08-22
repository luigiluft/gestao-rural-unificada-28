import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAllocationWaveById, useAllocateItem } from "@/hooks/useAllocationWaves"
import { useToast } from "@/hooks/use-toast"

export const useAlocacao = (waveId: string) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: wave, isLoading } = useAllocationWaveById(waveId)
  const allocateItem = useAllocateItem()

  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingItems = Array.isArray(wave?.allocation_wave_items) 
    ? wave.allocation_wave_items.filter((item: any) => item.status === 'pendente') 
    : []
  const currentItem = pendingItems[currentItemIndex]
  const currentPosition = currentItem?.storage_positions

  const handleAllocate = async (scannedProductCode: string, scannedPositionCode: string) => {
    if (!currentItem || !currentPosition) {
      toast({
        title: "Dados incompletos",
        description: "Item ou posição não encontrados",
        variant: "destructive",
      })
      return false
    }

    setIsProcessing(true)

    try {
      await allocateItem.mutateAsync({
        waveItemId: currentItem.id,
        posicaoId: currentItem.posicao_id,
        barcodeProduto: scannedProductCode,
        barcodePosicao: scannedPositionCode
      })

      if (currentItemIndex < pendingItems.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1)
      } else {
        toast({
          title: "Alocação concluída",
          description: "Todos os itens foram alocados com sucesso!",
        })
        navigate("/ondas-alocacao")
      }
      return true
    } catch (error) {
      console.error("Error allocating item:", error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipItem = () => {
    if (currentItemIndex < pendingItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }

  return {
    wave,
    isLoading,
    currentItem,
    currentPosition,
    pendingItems,
    currentItemIndex,
    isProcessing,
    handleAllocate,
    handleSkipItem,
    navigate
  }
}