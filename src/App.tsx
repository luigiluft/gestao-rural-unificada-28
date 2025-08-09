import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Entradas from "./pages/Entradas";
import Estoque from "./pages/Estoque";
import Saidas from "./pages/Saidas";
import Rastreio from "./pages/Rastreio";
import Relatorios from "./pages/Relatorios";
import Suporte from "./pages/Suporte";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import { RequireAuth } from "@/components/Auth/RequireAuth";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          {/* Rota pública */}
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
          {/* Área protegida com layout */}
          <AppLayout>
            <Routes>
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/entradas" element={<RequireAuth><Entradas /></RequireAuth>} />
              <Route path="/estoque" element={<RequireAuth><Estoque /></RequireAuth>} />
              <Route path="/saidas" element={<RequireAuth><Saidas /></RequireAuth>} />
              <Route path="/rastreio" element={<RequireAuth><Rastreio /></RequireAuth>} />
              <Route path="/relatorios" element={<RequireAuth><Relatorios /></RequireAuth>} />
              <Route path="/suporte" element={<RequireAuth><Suporte /></RequireAuth>} />
              <Route path="/perfil" element={<RequireAuth><Perfil /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
