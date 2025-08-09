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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/entradas" element={<Entradas />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/saidas" element={<Saidas />} />
            <Route path="/rastreio" element={<Rastreio />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/suporte" element={<Suporte />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
