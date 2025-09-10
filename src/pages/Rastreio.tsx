import React from 'react';
import { useRastreamentoEntradas, useRastreamentoEstoque, useRastreamentoSaidas } from '@/hooks/useRastreamentoData';
import { usePalletsPendentesItems } from '@/hooks/usePalletsPendentesItems';
import { ProducerDashboard } from '@/components/Rastreio/ProducerDashboard';
import { EntradasEmAndamento } from '@/components/Rastreio/EntradasEmAndamento';
import { EstoqueAtual } from '@/components/Rastreio/EstoqueAtual';
import { SaidasEmAndamento } from '@/components/Rastreio/SaidasEmAndamento';
import { FluxoChart } from '@/components/Rastreio/FluxoChart';
import { useFluxoData } from '@/hooks/useFluxoData';
import { useAuth } from '@/contexts/AuthContext';

export const Rastreio = () => {
  const { user, session, loading } = useAuth();
  
  // Log authentication status for debugging
  console.log("Rastreio page - Auth status:", { 
    user: user?.id, 
    session: !!session, 
    loading 
  });
  // Fetch tracking data (for current user or all users if admin)
  const { data: entradas = [], isLoading: isLoadingEntradas, error: errorEntradas } = useRastreamentoEntradas();
  const { data: estoque = [], isLoading: isLoadingEstoque, error: errorEstoque } = useRastreamentoEstoque();
  const { data: saidas = [], isLoading: isLoadingSaidas, error: errorSaidas } = useRastreamentoSaidas();
  const { data: palletsPendentesItems = [], error: errorPalletsPendentes } = usePalletsPendentesItems();

  // Log errors for debugging
  if (errorEntradas) console.error("Error loading entradas:", errorEntradas);
  if (errorEstoque) console.error("Error loading estoque:", errorEstoque);
  if (errorSaidas) console.error("Error loading saidas:", errorSaidas);
  if (errorPalletsPendentes) console.error("Error loading pallets pendentes:", errorPalletsPendentes);

  // Calculate dashboard stats
  const stats = {
    entradasEmTransito: entradas.length,
    itensNoEstoque: estoque.length,
    saidasEmAndamento: saidas.length,
    valorTotalEstoque: estoque.reduce((total, item) => {
      // Using valor_total_estoque since valor_medio doesn't exist in estoque view
      return total + (item.valor_total_estoque || 0);
    }, 0)
  };

  // Generate chart data
  const fluxoData = useFluxoData(entradas, estoque, saidas, palletsPendentesItems);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rastreamento</h1>
        <meta name="description" content="Acompanhe em tempo real entradas, estoque e saídas com nossa plataforma de rastreamento integrada." />
        <p className="text-muted-foreground">Acompanhe todo o fluxo dos produtos: desde a entrada até a expedição</p>
      </header>

      {/* Dashboard Stats */}
      <ProducerDashboard stats={stats} />

      {/* Chart Section */}
      <div className="mb-8">
        <FluxoChart data={fluxoData} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A Caminho - Entradas */}
        <div className="lg:col-span-1">
          <EntradasEmAndamento 
            entradas={entradas} 
            isLoading={isLoadingEntradas}
          />
        </div>

        {/* No Estoque */}
        <div className="lg:col-span-1">
          <EstoqueAtual 
            estoque={estoque} 
            isLoading={isLoadingEstoque}
          />
        </div>

        {/* Saindo */}
        <div className="lg:col-span-1">
          <SaidasEmAndamento 
            saidas={saidas} 
            isLoading={isLoadingSaidas}
          />
        </div>
      </div>
    </div>
  );
};

export default Rastreio;