import { useEffect } from 'react'
import { useLoginRedirect } from '@/hooks/useLoginRedirect'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/loading-state'

const Index = () => {
  const { user, loading } = useAuth()
  
  console.log('📍 INDEX (/): Rendering', { 
    user: user?.email, 
    loading,
    timestamp: new Date().toISOString()
  })
  
  // Use o hook de redirecionamento automático
  useLoginRedirect()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    console.log('📍 INDEX (/): Showing auth loading state')
    return <LoadingState variant="spinner" text="Verificando autenticação..." fullHeight />
  }

  // Se não está logado, mostrar página inicial
  if (!user) {
    console.log('📍 INDEX (/): User not logged in, showing login prompt')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sistema de Gestão Rural</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Faça login para acessar sua conta
          </p>
          <a 
            href="/auth" 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  // Se está logado, o redirecionamento acontecerá via useLoginRedirect
  console.log('📍 INDEX (/): User logged in, waiting for redirect')
  return <LoadingState variant="spinner" text="Redirecionando..." fullHeight />
};

export default Index;
