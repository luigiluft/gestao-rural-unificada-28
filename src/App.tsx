import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import Entradas from "./pages/Entradas";
import Estoque from "./pages/Estoque";
import Saidas from "./pages/Saidas";
import Rastreio from "./pages/Rastreio";
import Relatorios from "./pages/Relatorios";
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
import Transporte from "./pages/Transporte";
import PlanejamentoPalletsPage from "./pages/PlanejamentoPallets";
import Instrucoes from "./pages/Instrucoes";
import InstrucoesAdmin from "./pages/InstrucoesAdmin";
import InstrucoesFranqueado from "./pages/InstrucoesFranqueado";
import InstrucoesProdutor from "./pages/InstrucoesProdutor";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/completar-cadastro" element={<RequireAuth><CompletarCadastro /></RequireAuth>} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<RequirePageAccess pageKey="dashboard"><Dashboard /></RequirePageAccess>} />
              <Route path="catalogo" element={<RequirePageAccess pageKey="catalogo"><Catalogo /></RequirePageAccess>} />
              <Route path="entradas" element={<RequirePageAccess pageKey="entradas"><Entradas /></RequirePageAccess>} />
              <Route path="estoque" element={<RequirePageAccess pageKey="estoque"><Estoque /></RequirePageAccess>} />
              <Route path="saidas" element={<RequirePageAccess pageKey="saidas"><Saidas /></RequirePageAccess>} />
              <Route path="rastreio" element={<RequirePageAccess pageKey="rastreio"><Rastreio /></RequirePageAccess>} />
              <Route path="relatorios" element={<RequirePageAccess pageKey="relatorios"><Relatorios /></RequirePageAccess>} />
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
              
              {/* Legacy route redirect */}
              <Route path="ondas-alocacao" element={<RequirePageAccess pageKey="alocacao-pallets"><AlocacaoPallets /></RequirePageAccess>} />
              
              <Route path="alocacao-pallets" element={<RequirePageAccess pageKey="alocacao-pallets"><AlocacaoPallets /></RequirePageAccess>} />
              <Route path="gerenciar-alocacoes" element={<RequirePageAccess pageKey="gerenciar-alocacoes"><GerenciarPosicoes /></RequirePageAccess>} />
              <Route path="gerenciar-posicoes" element={<RequirePageAccess pageKey="gerenciar-posicoes"><GerenciarPosicoes /></RequirePageAccess>} />
              <Route path="inventario" element={<RequirePageAccess pageKey="inventario"><Inventario /></RequirePageAccess>} />
              <Route path="transporte" element={<RequirePageAccess pageKey="transporte"><Transporte /></RequirePageAccess>} />
              <Route path="remessas" element={<RequirePageAccess pageKey="remessas"><Remessas /></RequirePageAccess>} />
              <Route path="planejamento" element={<RequirePageAccess pageKey="planejamento"><Planejamento /></RequirePageAccess>} />
              <Route path="viagens" element={<RequirePageAccess pageKey="viagens"><Viagens /></RequirePageAccess>} />
              <Route path="agenda" element={<RequirePageAccess pageKey="agenda"><Agenda /></RequirePageAccess>} />
              <Route path="tracking" element={<RequirePageAccess pageKey="tracking"><Tracking /></RequirePageAccess>} />
              <Route path="proof-of-delivery" element={<RequirePageAccess pageKey="proof-of-delivery"><ProofOfDelivery /></RequirePageAccess>} />
              <Route path="ocorrencias" element={<RequirePageAccess pageKey="ocorrencias"><Ocorrencias /></RequirePageAccess>} />
              <Route path="tabelas-frete" element={<RequirePageAccess pageKey="tabelas-frete"><TabelasFrete /></RequirePageAccess>} />
              <Route path="planejamento-pallets/:entradaId" element={<RequirePageAccess pageKey="recebimento"><PlanejamentoPalletsPage /></RequirePageAccess>} />
              
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
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;