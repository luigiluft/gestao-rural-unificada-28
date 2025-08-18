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
import AprovacaoSaidas from "./pages/AprovacaoSaidas";
import Usuarios from "./pages/Usuarios";
import Produtores from "./pages/Produtores";
import Subcontas from "./pages/Subcontas";
import Franquias from "./pages/Franquias";
import Fazendas from "./pages/Fazendas";
import { RequireAuth } from "@/components/Auth/RequireAuth";
import { RequireAdmin } from "@/components/Auth/RequireAdmin";
import { RequireAdminOrFranqueado } from "@/components/Auth/RequireAdminOrFranqueado";
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
              <Route index element={<Dashboard />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="entradas" element={<Entradas />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="saidas" element={<Saidas />} />
              <Route path="rastreio" element={<Rastreio />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="usuarios" element={<RequireAdmin><Usuarios /></RequireAdmin>} />
              <Route path="franquias" element={<RequireAdmin><Franquias /></RequireAdmin>} />
              <Route path="franqueados" element={<RequireAdmin><Franqueados /></RequireAdmin>} />
              <Route path="recebimento" element={<RequireAdminOrFranqueado><AprovacaoEntradas /></RequireAdminOrFranqueado>} />
              <Route path="expedicao" element={<RequireAdminOrFranqueado><AprovacaoSaidas /></RequireAdminOrFranqueado>} />
              <Route path="produtores" element={<RequireAdminOrFranqueado><Produtores /></RequireAdminOrFranqueado>} />
              <Route path="fazendas" element={<Fazendas />} />
              <Route path="subcontas" element={<Subcontas />} />
              <Route path="suporte" element={<Suporte />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
