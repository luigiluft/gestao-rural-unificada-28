import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserTemplate } from './useUserTemplate'
import { useProfile } from './useProfile'

export const useLoginRedirect = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { data: userTemplate } = useUserTemplate()
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!user || !profile) return

    // Não redirecionar se já estamos em uma página específica (exceto auth)
    if (location.pathname !== '/' && location.pathname !== '/auth') return

    // Verificar se o usuário tem um template com rota padrão
    if (userTemplate?.permission_templates?.default_route) {
      console.log('🚀 Redirecting to template default route:', userTemplate.permission_templates.default_route)
      navigate(userTemplate.permission_templates.default_route, { replace: true })
      return
    }

    // Redirecionamento baseado no role do usuário (fallback)
    const roleRedirects = {
      'admin': '/dashboard',
      'franqueado': '/dashboard',
      'produtor': '/dashboard',
      'motorista': '/proof-of-delivery'
    }

    const defaultRoute = roleRedirects[profile.role as keyof typeof roleRedirects]
    if (defaultRoute && location.pathname === '/') {
      console.log('🚀 Redirecting to role default route:', defaultRoute)
      navigate(defaultRoute, { replace: true })
    }
  }, [user, userTemplate, profile, location.pathname, navigate])
}