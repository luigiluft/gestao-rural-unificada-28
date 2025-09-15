import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useProfile'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const Instrucoes = () => {
  const { data: profile, isLoading } = useProfile()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && profile?.role) {
      // Redirecionar baseado no role do usuário
      switch (profile.role) {
        case 'admin':
          navigate('/instrucoes/admin', { replace: true })
          break
        case 'franqueado':
          navigate('/instrucoes/franqueado', { replace: true })
          break
        case 'produtor':
          navigate('/instrucoes/produtor', { replace: true })
          break
        default:
          navigate('/instrucoes/produtor', { replace: true })
      }
    }
  }, [profile, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p className="text-muted-foreground">
          Redirecionando para as instruções específicas do seu perfil.
        </p>
      </Card>
    </div>
  )
}

export default Instrucoes