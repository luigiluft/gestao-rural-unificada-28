import { UserRole } from "@/types/permissions"

/**
 * Mapeamento de roles do backend para labels na UI
 * 
 * Backend e Frontend agora usam o mesmo nome: 'operador' e 'cliente'
 */
export const ROLE_LABELS = {
  admin: 'Administrador',
  operador: 'Operador',
  cliente: 'Cliente',
  motorista: 'Motorista',
  consumidor: 'Consumidor'
} as const

export const ROLE_LABELS_PLURAL = {
  admin: 'Administradores',
  operador: 'Operadores',
  cliente: 'Clientes',
  motorista: 'Motoristas',
  consumidores: 'Consumidores'
} as const

export const ROLE_LABELS_SHORT = {
  admin: 'Admin',
  operador: 'Operador',
  cliente: 'Cliente',
  motorista: 'Motorista',
  consumidor: 'Consumidor'
} as const

/**
 * Helper para obter o label traduzido de um role
 * @param role - Role do backend
 * @param plural - Se true, retorna versão plural
 * @param short - Se true, retorna versão abreviada
 */
export const getRoleLabel = (
  role: string | null | undefined, 
  plural = false,
  short = false
): string => {
  if (!role) return 'Usuário'
  
  if (short) {
    return ROLE_LABELS_SHORT[role as keyof typeof ROLE_LABELS_SHORT] || role
  }
  
  const map = plural ? ROLE_LABELS_PLURAL : ROLE_LABELS
  return map[role as keyof typeof map] || role
}
