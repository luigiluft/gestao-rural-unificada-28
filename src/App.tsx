import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Catalogo from "./pages/Catalogo";
import Entradas from "./pages/Entradas";
import Estoque from "./pages/Estoque";
import Saidas from "./pages/Saidas";
import Rastreio from "./pages/Rastreio";

import Suporte from "./pages/Suporte";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import CompletarCadastro from "./pages/CompletarCadastro";
import Franqueados from "./pages/Franqueados";
import AprovacaoEntradas from "./pages/AprovacaoEntradas";
import Separacao from "./pages/Separacao";
import AprovacaoSaidas from "./pages/AprovacaoSaidas";
import Usuarios from "./pages/Usuarios";
import Produtores from "./pages/Produtores";
import Subcontas from "./pages/Subcontas";
import Franquias from "./pages/Franquias";
import Fazendas from "./pages/Fazendas";
import Configuracoes from "./pages/Configuracoes";
import ControleAcesso from "./pages/ControleAcesso";
import PerfisFuncionarios from "./pages/PerfisFuncionarios";
import AlocacaoPallets from "./pages/AlocacaoPallets";
import GerenciarPosicoes from "./pages/GerenciarPosicoes";
import Inventario from "./pages/Inventario";

import Remessas from "./pages/Remessas";

import Viagens from "./pages/Viagens";
import Planejamento from "./pages/Planejamento";
import Tracking from "./pages/Tracking";
import ProofOfDelivery from "./pages/ProofOfDelivery";
import Comprovantes from "./pages/Comprovantes";
import Ocorrencias from "./pages/Ocorrencias";
import TabelasFrete from "./pages/TabelasFrete";
import TabelaFrete from "./pages/TabelaFrete";
import Veiculos from "./pages/Veiculos";
import Motoristas from "./pages/Motoristas";
import MotoristaLogin from "./pages/MotoristaLogin";
import MotoristaDeliveries from "./pages/MotoristaDeliveries";
import PlanejamentoPalletsPage from "./pages/PlanejamentoPallets";
import Instrucoes from "./pages/Instrucoes";
import InstrucoesAdmin from "./pages/InstrucoesAdmin";
import InstrucoesFranqueado from "./pages/InstrucoesFranqueado";
import InstrucoesProdutor from "./pages/InstrucoesProdutor";
import Divergencias from "./pages/Divergencias";
import Faturas from "./pages/Faturas";
import Financeiro from "./pages/Financeiro";
import Royalties from "./pages/Royalties";
import Contratos from "./pages/Contratos";
import ContratoDetalhes from "./pages/ContratoDetalhes";
import DemoDashboard from "./pages/Demo/DemoDashboard";
import DemoEntradas from "./pages/Demo/DemoEntradas";
import DemoEstoque from "./pages/Demo/DemoEstoque";
import DemoSaidas from "./pages/Demo/DemoSaidas";
import DemoRecebimento from "./pages/Demo/DemoRecebimento";
import { RequireAuth } from "@/components/Auth/RequireAuth";
import { RequireAdmin } from "@/components/Auth/RequireAdmin";
import { RequireAdminOrFranqueado } from "@/components/Auth/RequireAdminOrFranqueado";
import { RequirePageAccess } from "@/components/Auth/RequirePageAccess";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  // Initialize PWA elements after React is ready
  useEffect(() => {
    const initializePWAElements = async () => {
      try {
        const { defineCustomElements } = await import('@ionic/pwa-elements/loader');
        defineCustomElements(window);
      } catch (error) {
        console.warn('Failed to load PWA elements:', error);
      }
    };
    
    initializePWAElements();
  }, []);

  // Detectar se está rodando no Lovable
  const isLovable = window.location.hostname.endsWith('lovableproject.com') || 
                    window.location.search.includes('__lovable_token');
  const Router = isLovable ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Router>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/motorista/login" element={<MotoristaLogin />} />
            <Route path="/motorista/deliveries" element={<RequireAuth><MotoristaDeliveries /></RequireAuth>} />
            <Route path="/completar-cadastro" element={<RequireAuth><CompletarCadastro /></RequireAuth>} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<RequirePageAccess pageKey="dashboard"><Dashboard /></RequirePageAccess>} />
              <Route path="catalogo" element={<RequirePageAccess pageKey="catalogo"><Catalogo /></RequirePageAccess>} />
              <Route path="entradas" element={<RequirePageAccess pageKey="entradas"><Entradas /></RequirePageAccess>} />
              <Route path="estoque" element={<RequirePageAccess pageKey="estoque"><Estoque /></RequirePageAccess>} />
              <Route path="saidas" element={<RequirePageAccess pageKey="saidas"><Saidas /></RequirePageAccess>} />
              <Route path="rastreio" element={<RequirePageAccess pageKey="rastreio"><Rastreio /></RequirePageAccess>} />
              <Route path="usuarios" element={<RequirePageAccess pageKey="usuarios"><Usuarios /></RequirePageAccess>} />
              <Route path="franquias" element={<RequirePageAccess pageKey="franquias"><Franquias /></RequirePageAccess>} />
              <Route path="franqueados" element={<RequirePageAccess pageKey="franqueados"><Franqueados /></RequirePageAccess>} />
              <Route path="recebimento" element={<RequirePageAccess pageKey="recebimento"><AprovacaoEntradas /></RequirePageAccess>} />
              <Route path="separacao" element={<RequirePageAccess pageKey="separacao"><Separacao /></RequirePageAccess>} />
              <Route path="expedicao" element={<RequirePageAccess pageKey="expedicao"><AprovacaoSaidas /></RequirePageAccess>} />
              <Route path="produtores" element={<RequirePageAccess pageKey="produtores"><Produtores /></RequirePageAccess>} />
              <Route path="fazendas" element={<RequirePageAccess pageKey="fazendas"><Fazendas /></RequirePageAccess>} />
              <Route path="subcontas" element={<RequirePageAccess pageKey="subcontas"><Subcontas /></RequirePageAccess>} />
              <Route path="suporte" element={<RequirePageAccess pageKey="suporte"><Suporte /></RequirePageAccess>} />
              <Route path="perfil" element={<RequirePageAccess pageKey="perfil"><Perfil /></RequirePageAccess>} />
              <Route path="configuracoes" element={<RequirePageAccess pageKey="configuracoes"><Configuracoes /></RequirePageAccess>} />
              <Route path="controle-acesso" element={<RequirePageAccess pageKey="controle-acesso"><ControleAcesso /></RequirePageAccess>} />
              <Route path="perfis-funcionarios" element={<RequirePageAccess pageKey="perfis-funcionarios"><PerfisFuncionarios /></RequirePageAccess>} />
              <Route path="contratos" element={<RequirePageAccess pageKey="contratos"><Contratos /></RequirePageAccess>} />
              <Route path="contratos/:id" element={<RequirePageAccess pageKey="contratos"><ContratoDetalhes /></RequirePageAccess>} />
              <Route path="faturas" element={<RequirePageAccess pageKey="faturas"><Faturas /></RequirePageAccess>} />
              <Route path="financeiro" element={<RequirePageAccess pageKey="financeiro"><Financeiro /></RequirePageAccess>} />
              <Route path="royalties" element={<RequirePageAccess pageKey="royalties"><Royalties /></RequirePageAccess>} />
              
              {/* Legacy route redirect */}
              <Route path="ondas-alocacao" element={<RequirePageAccess pageKey="alocacao-pallets"><AlocacaoPallets /></RequirePageAccess>} />
              
              <Route path="alocacao-pallets" element={<RequirePageAccess pageKey="alocacao-pallets"><AlocacaoPallets /></RequirePageAccess>} />
              <Route path="gerenciar-alocacoes" element={<RequirePageAccess pageKey="gerenciar-alocacoes"><GerenciarPosicoes /></RequirePageAccess>} />
              <Route path="gerenciar-posicoes" element={<RequirePageAccess pageKey="gerenciar-posicoes"><GerenciarPosicoes /></RequirePageAccess>} />
              <Route path="inventario" element={<RequirePageAccess pageKey="inventario"><Inventario /></RequirePageAccess>} />
              
              <Route path="remessas" element={<RequirePageAccess pageKey="remessas"><Remessas /></RequirePageAccess>} />
              
              <Route path="planejamento" element={<RequirePageAccess pageKey="viagens"><Planejamento /></RequirePageAccess>} />
              <Route path="viagens" element={<RequirePageAccess pageKey="viagens"><Viagens /></RequirePageAccess>} />
              <Route path="veiculos" element={<RequirePageAccess pageKey="veiculos"><Veiculos /></RequirePageAccess>} />
              <Route path="motoristas" element={<RequirePageAccess pageKey="motoristas"><Motoristas /></RequirePageAccess>} />
              <Route path="tracking" element={<RequirePageAccess pageKey="tracking"><Tracking /></RequirePageAccess>} />
              <Route path="proof-of-delivery" element={<RequirePageAccess pageKey="proof-of-delivery"><ProofOfDelivery /></RequirePageAccess>} />
              <Route path="comprovantes" element={<RequirePageAccess pageKey="comprovantes"><Comprovantes /></RequirePageAccess>} />
              <Route path="ocorrencias" element={<RequirePageAccess pageKey="ocorrencias"><Ocorrencias /></RequirePageAccess>} />
              <Route path="tabelas-frete" element={<RequirePageAccess pageKey="tabelas-frete"><TabelasFrete /></RequirePageAccess>} />
              <Route path="tabela-frete" element={<RequirePageAccess pageKey="tabela-frete"><TabelaFrete /></RequirePageAccess>} />
              <Route path="tabela-frete/:id" element={<RequirePageAccess pageKey="tabela-frete"><TabelaFrete /></RequirePageAccess>} />
              <Route path="planejamento-pallets/:entradaId" element={<RequirePageAccess pageKey="recebimento"><PlanejamentoPalletsPage /></RequirePageAccess>} />
              <Route path="divergencias" element={<RequirePageAccess pageKey="divergencias"><Divergencias /></RequirePageAccess>} />
              
              {/* Rotas de Instruções */}
              <Route path="instrucoes" element={<RequirePageAccess pageKey="instrucoes"><Instrucoes /></RequirePageAccess>} />
              <Route path="instrucoes/admin" element={<RequirePageAccess pageKey="instrucoes"><InstrucoesAdmin /></RequirePageAccess>} />
              <Route path="instrucoes/franqueado" element={<RequirePageAccess pageKey="instrucoes"><InstrucoesFranqueado /></RequirePageAccess>} />
              <Route path="instrucoes/produtor" element={<RequirePageAccess pageKey="instrucoes"><InstrucoesProdutor /></RequirePageAccess>} />
              
              {/* Demo Routes for Tutorial */}
              <Route path="demo/dashboard" element={<RequirePageAccess pageKey="dashboard"><DemoDashboard /></RequirePageAccess>} />
              <Route path="demo/entradas" element={<RequirePageAccess pageKey="entradas"><DemoEntradas /></RequirePageAccess>} />
              <Route path="demo/recebimento" element={<RequirePageAccess pageKey="recebimento"><DemoRecebimento /></RequirePageAccess>} />
              <Route path="demo/estoque" element={<RequirePageAccess pageKey="estoque"><DemoEstoque /></RequirePageAccess>} />
              <Route path="demo/saidas" element={<RequirePageAccess pageKey="saidas"><DemoSaidas /></RequirePageAccess>} />
              
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </Router>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;