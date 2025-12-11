import { useClienteModulos } from "./useClienteModulos"

/**
 * Hook para determinar o modo de operação de estoque baseado na configuração WMS
 * 
 * Quando WMS está habilitado:
 * - Pallets são criados nas entradas
 * - Posições físicas são usadas
 * - Separação é por pallet
 * - Páginas WMS são visíveis
 * 
 * Quando WMS está desabilitado:
 * - Movimentações diretas são criadas
 * - Sem pallets ou posições
 * - Separação simplificada por quantidade
 * - Páginas WMS ficam ocultas
 */
export const useEstoqueMode = () => {
  const { wmsHabilitado, isLoading } = useClienteModulos()

  return {
    // Modos de operação
    isWmsMode: wmsHabilitado,
    isSimpleMode: !wmsHabilitado,
    
    // Helpers para comportamento
    shouldShowPallets: wmsHabilitado,
    shouldShowPositions: wmsHabilitado,
    shouldCreatePallets: wmsHabilitado,
    shouldShowPalletPlanning: wmsHabilitado,
    
    // Loading state
    isLoading,
    
    // Labels para UI
    modeLabel: wmsHabilitado ? 'WMS Completo' : 'Estoque Simplificado',
    modeDescription: wmsHabilitado 
      ? 'Controle por pallet e posição física'
      : 'Controle simplificado por produto/lote'
  }
}
