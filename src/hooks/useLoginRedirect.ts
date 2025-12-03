import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserTemplate } from './useUserTemplate'
import { useProfile } from './useProfile'
import { useSimplifiedPermissions } from './useSimplifiedPermissions'

// Lista priorizada de rotas para verificar acesso
const PRIORITY_ROUTES = [
  { path: '/dashboard', permission: 'dashboard.view' },
  { path: '/entradas', permission: 'entradas.view' },
  { path: '/recebimento', permission: 'recebimento.view' },
  { path: '/estoque', permission: 'estoque.view' },
  { path: '/saidas', permission: 'saidas.view' },
  { path: '/expedicao', permission: 'expedicao.view' },
  { path: '/proof-of-delivery', permission: 'proof-of-delivery.view' },
  { path: '/rastreio', permission: 'rastreio.view' },
  { path: '/catalogo', permission: 'catalogo.view' },
]

export const useLoginRedirect = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { data: userTemplate } = useUserTemplate()
  const { data: profile } = useProfile()
  const { permissions, isLoading: permissionsLoading } = useSimplifiedPermissions()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!user || !profile) return

    // Não redirecionar se já estamos em uma página específica (exceto auth)
    if (location.pathname !== '/' && location.pathname !== '/auth') {
      return
    }

    // Evitar múltiplos redirecionamentos
    if (hasRedirectedRef.current) {
      return
    }

    // Timeout de 10s para o redirect - se demorar muito, usar fallback
    const redirectTimeout = setTimeout(() => {
      if (!hasRedirectedRef.current && (location.pathname === '/' || location.pathname === '/auth')) {
        console.warn('⚠️ Redirect timeout - usando fallback baseado em role')
        
        const roleFallbacks: Record<string, string> = {
          'admin': '/dashboard',
          'operador': '/dashboard',
          'cliente': '/rastreio',
          'motorista': '/proof-of-delivery',
          'consumidor': '/minha-conta'
        }
        
        const fallbackRoute = roleFallbacks[profile.role as string] || '/dashboard'
        hasRedirectedRef.current = true
        navigate(fallbackRoute, { replace: true })
      }
    }, 10000) // 10 seconds

    // Verificar se o usuário tem um template com rota padrão
    if (userTemplate?.permission_templates?.default_route) {
      const targetRoute = userTemplate.permission_templates.default_route
      
      // Debug log
      console.log('🔄 useLoginRedirect - Template route:', { 
        from: location.pathname, 
        to: targetRoute,
        role: profile.role 
      })
      
      // Só redirecionar se a rota de destino for diferente da atual
      if (targetRoute !== location.pathname) {
        clearTimeout(redirectTimeout)
        hasRedirectedRef.current = true
        navigate(targetRoute, { replace: true })
      }
      return () => clearTimeout(redirectTimeout)
    }

    // ⚠️ Não bloquear o redirect se as permissões demorarem a carregar
    // Vamos continuar usando fallbacks baseados em role mesmo que permissionsLoading seja true

    // Calcular primeira rota acessível baseada nas permissões
    let firstAccessibleRoute = null
    
    for (const route of PRIORITY_ROUTES) {
      if (permissions.includes(route.permission as any)) {
        firstAccessibleRoute = route.path
        break
      }
    }

    // Fallback baseado no role se não encontrou rota nas permissões
    if (!firstAccessibleRoute) {
      const roleDefaults: Record<string, { path: string; permission: string }> = {
        'admin': { path: '/dashboard', permission: 'dashboard.view' },
        'operador': { path: '/dashboard', permission: 'dashboard.view' },
        'cliente': { path: '/rastreio', permission: 'rastreio.view' },
        'motorista': { path: '/proof-of-delivery', permission: 'proof-of-delivery.view' },
        'consumidor': { path: '/minha-conta', permission: '' }
      }
      
      const roleDefault = roleDefaults[profile.role as string]
      if (roleDefault) {
        firstAccessibleRoute = roleDefault.path
      } else {
        firstAccessibleRoute = '/dashboard' // fallback final
      }
    }

    // Debug log
    console.log('🔄 useLoginRedirect - Permission-based route:', { 
      from: location.pathname, 
      to: firstAccessibleRoute,
      role: profile.role,
      permissions: permissions.slice(0, 3)
    })

    // Só redirecionar se estamos no "/" ou "/auth"
    if ((location.pathname === '/' || location.pathname === '/auth') && firstAccessibleRoute !== location.pathname) {
      clearTimeout(redirectTimeout)
      hasRedirectedRef.current = true
      navigate(firstAccessibleRoute, { replace: true })
    }

    return () => clearTimeout(redirectTimeout)
  }, [user, userTemplate, profile, permissions, permissionsLoading, location.pathname, navigate])
}