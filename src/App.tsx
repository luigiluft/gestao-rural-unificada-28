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
import OndasAlocacao from "./pages/OndasAlocacao";
import AlocacaoComColetor from "./pages/AlocacaoComColetor";
import AlocacaoManual from "./pages/AlocacaoManual";
import GerenciarPosicoes from "./pages/GerenciarPosicoes";
import Inventario from "./pages/Inventario";
import Transporte from "./pages/Transporte";
import { RequireAuth } from "@/components/Auth/RequireAuth";
import { RequireAdmin } from "@/components/Auth/RequireAdmin";
import { RequireAdminOrFranqueado } from "@/components/Auth/RequireAdminOrFranqueado";
import { RequirePageAccess } from "@/components/Auth/RequirePageAccess";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
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
              <Route path="ondas-alocacao" element={<RequirePageAccess pageKey="ondas-alocacao"><OndasAlocacao /></RequirePageAccess>} />
              <Route path="alocar-scanner/:waveId" element={<RequirePageAccess pageKey="alocacao-funcionario"><AlocacaoComColetor /></RequirePageAccess>} />
              <Route path="alocar-manual/:waveId" element={<RequirePageAccess pageKey="alocacao-funcionario"><AlocacaoManual /></RequirePageAccess>} />
              <Route path="gerenciar-posicoes" element={<RequirePageAccess pageKey="gerenciar-posicoes"><GerenciarPosicoes /></RequirePageAccess>} />
              <Route path="inventario" element={<RequirePageAccess pageKey="inventario"><Inventario /></RequirePageAccess>} />
              <Route path="transporte" element={<RequirePageAccess pageKey="transporte"><Transporte /></RequirePageAccess>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;