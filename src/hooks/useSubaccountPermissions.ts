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
  // Para subcontas, sempre usamos permissões de funcionário do mesmo role do usuário
  const getSubaccountPermissions = (): PermissionCode[] => {
    if (!userRole) return []
    return EMPLOYEE_PERMISSIONS[userRole] || []
  }

  const getSubaccountRole = (): UserRole | null => {
    return userRole // Subconta sempre tem o mesmo role do usuário
  }

  const getSubaccountRoleLabel = (): string => {
    if (!userRole) return ''
    
    const labels = {
      admin: 'Funcionário Administrativo',
      franqueado: 'Funcionário da Franquia', 
      produtor: 'Funcionário do Produtor'
    }
    return labels[userRole]
  }

  const getSubaccountDescription = (): string => {
    if (!userRole) return ''
    
    const descriptions = {
      admin: 'Funcionário administrativo com permissões limitadas para ajudar na operação',
      franqueado: 'Funcionário da franquia com permissões limitadas para operações básicas',
      produtor: 'Funcionário do produtor para ajudar na visualização do estoque'
    }
    
    return descriptions[userRole] || ''
  }

  return {
    getSubaccountPermissions,
    getSubaccountRole,
    getSubaccountRoleLabel,
    getSubaccountDescription
  }
}