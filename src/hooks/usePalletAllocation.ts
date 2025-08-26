import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePalletAllocationWaveById, useAllocatePallet } from "@/hooks/useAllocationWaves"
import { useToast } from "@/hooks/use-toast"

export interface PalletProduct {
  produto_id: string
  nome_produto: string
  lote: string
  quantidade_original: number
  quantidade_conferida: number
  valor_unitario: number
  data_validade?: string
  status: 'pendente' | 'conferido' | 'faltante' | 'danificado'
  observacoes?: string
}

export interface PalletDivergencia {
  produto_id: string
  tipo: 'faltante' | 'danificado'
  quantidade: number
  observacoes?: string
}

export const usePalletAllocation = (waveId: string) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: wave, isLoading } = usePalletAllocationWaveById(waveId)
  const allocatePallet = useAllocatePallet()

  const [currentPalletIndex, setCurrentPalletIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [productsStatus, setProductsStatus] = useState<PalletProduct[]>([])
  const [divergencias, setDivergencias] = useState<PalletDivergencia[]>([])
  const [conferenciaMode, setConferenciaMode] = useState(false)

  const pendingPallets = Array.isArray(wave?.allocation_wave_pallets) 
    ? wave.allocation_wave_pallets.filter((pallet: any) => pallet.status === 'pendente') 
    : []
  const currentPallet = pendingPallets[currentPalletIndex]
  const currentPosition = currentPallet?.storage_positions

  // Inicializar produtos do pallet atual
  const initializePalletProducts = () => {
    if (!currentPallet?.entrada_pallets?.entrada_pallet_itens) return

    const products: PalletProduct[] = currentPallet.entrada_pallets.entrada_pallet_itens.map((item: any) => ({
      produto_id: item.entrada_itens.produto_id,
      nome_produto: item.entrada_itens.nome_produto,
      lote: item.entrada_itens.lote || '',
      quantidade_original: item.quantidade,
      quantidade_conferida: item.quantidade,
      valor_unitario: item.entrada_itens.valor_unitario || 0,
      data_validade: item.entrada_itens.data_validade,
      status: 'pendente' as const,
      observacoes: ''
    }))

    setProductsStatus(products)
    setDivergencias([])
  }

  // Atualizar status de um produto
  const updateProductStatus = (produtoId: string, status: PalletProduct['status'], quantidadeConferida?: number, observacoes?: string) => {
    setProductsStatus(prev => 
      prev.map(product => 
        product.produto_id === produtoId 
          ? { 
              ...product, 
              status,
              quantidade_conferida: quantidadeConferida ?? product.quantidade_conferida,
              observacoes: observacoes ?? product.observacoes
            }
          : product
      )
    )

    // Gerenciar divergências
    if (status === 'faltante' || status === 'danificado') {
      const product = productsStatus.find(p => p.produto_id === produtoId)
      if (product) {
        const quantidadeDivergencia = status === 'faltante' 
          ? product.quantidade_original 
          : product.quantidade_original - (quantidadeConferida || 0)

        setDivergencias(prev => {
          const existing = prev.find(d => d.produto_id === produtoId && d.tipo === status)
          if (existing) {
            return prev.map(d => 
              d.produto_id === produtoId && d.tipo === status
                ? { ...d, quantidade: quantidadeDivergencia, observacoes }
                : d
            )
          } else {
            return [...prev, {
              produto_id: produtoId,
              tipo: status,
              quantidade: quantidadeDivergencia,
              observacoes
            }]
          }
        })
      }
    } else {
      // Remover divergências se o produto foi marcado como conferido
      setDivergencias(prev => prev.filter(d => d.produto_id !== produtoId))
    }
  }

  // Verificar se todos os produtos foram conferidos
  const allProductsChecked = () => {
    return productsStatus.length > 0 && productsStatus.every(p => p.status !== 'pendente')
  }

  // Alocar pallet
  const handleAllocatePallet = async (scannedPalletCode: string, scannedPositionCode: string) => {
    if (!currentPallet) {
      toast({
        title: "Dados incompletos",
        description: "Pallet não encontrado",
        variant: "destructive",
      })
      return false
    }

    if (!currentPosition) {
      toast({
        title: "Posição não definida",
        description: "Este pallet não tem uma posição definida. Retorne à página de ondas e redefina as posições.",
        variant: "destructive",
      })
      return false
    }

    if (!allProductsChecked()) {
      toast({
        title: "Conferência incompleta",
        description: "Todos os produtos devem ser conferidos antes da alocação",
        variant: "destructive",
      })
      return false
    }

    setIsProcessing(true)

    try {
      const produtosConferidos = productsStatus.map(product => ({
        produto_id: product.produto_id,
        quantidade_conferida: product.quantidade_conferida,
        lote: product.lote,
        valor_unitario: product.valor_unitario,
        data_validade: product.data_validade,
        status: product.status,
        observacoes: product.observacoes
      }))

      await allocatePallet.mutateAsync({
        wavePalletId: currentPallet.id,
        posicaoId: currentPosition.id,
        barcodePallet: scannedPalletCode,
        barcodePosicao: scannedPositionCode,
        produtosConferidos,
        divergencias
      })

      if (currentPalletIndex < pendingPallets.length - 1) {
        setCurrentPalletIndex(currentPalletIndex + 1)
        setConferenciaMode(false)
        initializePalletProducts()
      } else {
        toast({
          title: "Alocação concluída",
          description: "Todos os pallets foram alocados com sucesso!",
        })
        navigate("/ondas-alocacao")
      }
      return true
    } catch (error) {
      console.error("Error allocating pallet:", error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipPallet = () => {
    if (currentPalletIndex < pendingPallets.length - 1) {
      setCurrentPalletIndex(currentPalletIndex + 1)
      setConferenciaMode(false)
      initializePalletProducts()
    }
  }

  const startConferencia = () => {
    initializePalletProducts()
    setConferenciaMode(true)
  }

  return {
    wave,
    isLoading,
    currentPallet,
    currentPosition,
    pendingPallets,
    currentPalletIndex,
    isProcessing,
    productsStatus,
    divergencias,
    conferenciaMode,
    allProductsChecked: allProductsChecked(),
    handleAllocatePallet,
    handleSkipPallet,
    updateProductStatus,
    startConferencia,
    setConferenciaMode,
    navigate
  }
}