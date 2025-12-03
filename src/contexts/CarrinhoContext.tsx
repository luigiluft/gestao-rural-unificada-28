import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { MarketplaceAnuncio } from "@/hooks/useMarketplace"

export interface ItemCarrinho {
  anuncio: MarketplaceAnuncio
  quantidade: number
}

interface CarrinhoContextType {
  itens: ItemCarrinho[]
  adicionarItem: (anuncio: MarketplaceAnuncio, quantidade: number) => void
  removerItem: (anuncioId: string) => void
  atualizarQuantidade: (anuncioId: string, quantidade: number) => void
  limparCarrinho: () => void
  totalItens: number
  subtotal: number
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined)

const STORAGE_KEY = "agrohub_carrinho"

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setItens(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens))
  }, [itens])

  const adicionarItem = (anuncio: MarketplaceAnuncio, quantidade: number) => {
    setItens((prev) => {
      const existente = prev.find((item) => item.anuncio.id === anuncio.id)
      if (existente) {
        return prev.map((item) =>
          item.anuncio.id === anuncio.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        )
      }
      return [...prev, { anuncio, quantidade }]
    })
  }

  const removerItem = (anuncioId: string) => {
    setItens((prev) => prev.filter((item) => item.anuncio.id !== anuncioId))
  }

  const atualizarQuantidade = (anuncioId: string, quantidade: number) => {
    setItens((prev) =>
      prev.map((item) =>
        item.anuncio.id === anuncioId ? { ...item, quantidade } : item
      )
    )
  }

  const limparCarrinho = () => {
    setItens([])
  }

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0)

  const subtotal = itens.reduce((acc, item) => {
    const preco = item.anuncio.preco_promocional || item.anuncio.preco_unitario
    return acc + preco * item.quantidade
  }, 0)

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        totalItens,
        subtotal,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  const context = useContext(CarrinhoContext)
  if (!context) {
    throw new Error("useCarrinho must be used within a CarrinhoProvider")
  }
  return context
}
