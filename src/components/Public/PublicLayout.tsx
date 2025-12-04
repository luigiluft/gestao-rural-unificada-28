import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { useEmpresaMatriz, getEnderecoResumido } from "@/hooks/useEmpresaMatriz";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Home", path: "/site" },
  { label: "Sobre", path: "/site/sobre" },
  { label: "Como Funciona", path: "/site/como-funciona" },
  { label: "Benefícios", path: "/site/beneficios" },
  { label: "Encontre um Depósito", path: "/site/encontre-deposito" },
  { label: "Parceiros", path: "/site/parceiros" },
  { label: "Marketplace", path: "/marketplace" },
  { label: "Seja um Franqueado", path: "/site/seja-franqueado" },
  { label: "Contato", path: "/site/contato" },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { data: profile } = useProfile();
  const { data: empresaData } = useEmpresaMatriz();

  const handleLogout = async () => {
    await logout();
    navigate("/site");
  };

  const getAccountPath = () => {
    // Consumidor goes to /marketplace/minha-conta, others go to /dashboard
    if (profile?.role === "consumidor") {
      return "/marketplace/minha-conta";
    }
    return "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/site" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">L</span>
              </div>
              <span className="font-bold text-xl text-foreground">
                {empresaData?.nome_fantasia || "Luft AgroHub"}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Login/Account Button */}
            <div className="hidden lg:flex items-center gap-3">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {profile?.nome?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden xl:inline">
                        {profile?.nome?.split(" ")[0] || "Usuário"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(getAccountPath())}>
                      <User className="h-4 w-4 mr-2" />
                      Minha Conta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar / Cadastrar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                {session ? (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        navigate(getAccountPath());
                        setMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Minha Conta
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <LogIn className="h-4 w-4" />
                      Entrar / Cadastrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">L</span>
                </div>
                <span className="font-bold text-xl text-foreground">
                  {empresaData?.nome_fantasia || "Luft AgroHub"}
                </span>
              </div>
              <p className="text-muted-foreground max-w-md">
                A maior rede de armazenagem rural digital do Brasil. Conectando produtores, 
                indústrias e revendas a uma rede logística inteligente e eficiente.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Navegação</h4>
              <ul className="space-y-2">
                {navItems.slice(0, 4).map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contato</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a 
                    href={`mailto:${empresaData?.email || "contato@luftagrohub.com.br"}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {empresaData?.email || "contato@luftagrohub.com.br"}
                  </a>
                </li>
                <li>
                  <a 
                    href={`tel:${(empresaData?.telefone || "").replace(/\D/g, "")}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {empresaData?.telefone || "(43) 99999-9999"}
                  </a>
                </li>
                <li>{empresaData ? getEnderecoResumido(empresaData) : "Londrina, PR - Brasil"}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} {empresaData?.nome_fantasia || "Luft AgroHub"}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
