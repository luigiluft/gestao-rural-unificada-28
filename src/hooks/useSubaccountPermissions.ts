import { useMemo } from "react"
import { PermissionCode, UserRole } from "@/pages/Subcontas"

// Templates de permissões por role
export const PERMISSION_TEMPLATES: Record<UserRole, PermissionCode[]> = {
  admin: [
    'estoque.view',
    'estoque.manage', 
    'entradas.manage',
    'saidas.manage',
    'relatorios.view',
    'usuarios.manage'
  ],
  franqueado: [
    'estoque.view',
    'estoque.manage',
    'entradas.manage', 
    'saidas.manage',
    'relatorios.view'
  ],
  produtor: [
    'estoque.view'
  ]
}

// Permissões que um funcionário pode ter baseado no role do pai
export const EMPLOYEE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  admin: PERMISSION_TEMPLATES.admin, // Admin pode dar qualquer permissão
  franqueado: [
    'estoque.view',
    'entradas.manage',
    'saidas.manage'
  ],
  produtor: [
    'estoque.view'
  ]
}

export const useSubaccountPermissions = (userRole: UserRole | null) => {
  const availableRoles = useMemo(() => {
    if (!userRole) return []
    
    switch (userRole) {
      case 'admin':
        return ['admin', 'franqueado', 'produtor'] as UserRole[]
      case 'franqueado':
        return ['franqueado', 'produtor'] as UserRole[]
      case 'produtor':
        return ['produtor'] as UserRole[]
      default:
        return []
    }
  }, [userRole])

  const getDefaultPermissions = (targetRole: UserRole, isEmployee = false): PermissionCode[] => {
    if (isEmployee && userRole) {
      return EMPLOYEE_PERMISSIONS[userRole] || []
    }
    return PERMISSION_TEMPLATES[targetRole] || []
  }

  const getAvailablePermissions = (targetRole: UserRole): PermissionCode[] => {
    if (!userRole) return []
    
    // Admin pode dar qualquer permissão
    if (userRole === 'admin') {
      return PERMISSION_TEMPLATES.admin
    }
    
    // Outros usuários só podem dar permissões que eles próprios têm
    return EMPLOYEE_PERMISSIONS[userRole] || []
  }

  const getRoleLabel = (role: UserRole): string => {
    const labels = {
      admin: 'Administrador',
      franqueado: 'Franqueado',
      produtor: 'Produtor'
    }
    return labels[role]
  }

  const getRoleDescription = (role: UserRole, userRole: UserRole | null): string => {
    if (!userRole) return ''
    
    const descriptions = {
      admin: {
        admin: 'Outro administrador com acesso total ao sistema',
        franqueado: 'Administrador com acesso total ao sistema', 
        produtor: 'Administrador com acesso total ao sistema'
      },
      franqueado: {
        admin: '',
        franqueado: 'Funcionário da franquia com permissões limitadas',
        produtor: 'Produtor associado à sua franquia'
      },
      produtor: {
        admin: '',
        franqueado: '',
        produtor: 'Funcionário para ajudar na operação'
      }
    }
    
    return descriptions[userRole]?.[role] || ''
  }

  return {
    availableRoles,
    getDefaultPermissions,
    getAvailablePermissions,
    getRoleLabel,
    getRoleDescription
  }
}