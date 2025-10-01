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
    if (!user || !profile || permissionsLoading) return

    // Não redirecionar se já estamos em uma página específica (exceto auth)
    if (location.pathname !== '/' && location.pathname !== '/auth') {
      return
    }

    // Evitar múltiplos redirecionamentos
    if (hasRedirectedRef.current) {
      return
    }

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
        hasRedirectedRef.current = true
        navigate(targetRoute, { replace: true })
      }
      return
    }

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
      // Tentar rota padrão do role, mas só se a permissão existir
      const roleDefaults: Record<string, { path: string; permission: string }> = {
        'admin': { path: '/dashboard', permission: 'dashboard.view' },
        'franqueado': { path: '/dashboard', permission: 'dashboard.view' },
        'produtor': { path: '/dashboard', permission: 'dashboard.view' },
        'motorista': { path: '/proof-of-delivery', permission: 'proof-of-delivery.view' }
      }
      
      const roleDefault = roleDefaults[profile.role as string]
      if (roleDefault && permissions.includes(roleDefault.permission as any)) {
        firstAccessibleRoute = roleDefault.path
      } else {
        // Se nem o padrão do role tem permissão, usar a primeira rota acessível de PRIORITY_ROUTES
        firstAccessibleRoute = PRIORITY_ROUTES[0].path // fallback final para /dashboard
      }
    }

    // Debug log
    console.log('🔄 useLoginRedirect - Permission-based route:', { 
      from: location.pathname, 
      to: firstAccessibleRoute,
      role: profile.role,
      permissions: permissions.slice(0, 3) // Primeiras 3 permissões
    })

    // Só redirecionar se:
    // 1. Estamos no "/"
    // 2. A rota de destino é diferente da atual
    if (location.pathname === '/' && firstAccessibleRoute !== location.pathname) {
      hasRedirectedRef.current = true
      navigate(firstAccessibleRoute, { replace: true })
    }
  }, [user, userTemplate, profile, permissions, permissionsLoading, location.pathname, navigate])
}