import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar CNPJ com máscara
export const formatarCnpjComMascara = (cnpj: string): string => {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  if (cnpjLimpo.length !== 14) return cnpj
  
  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

// Função para buscar fornecedor por CNPJ (ambos formatos)
export const findFornecedorByCnpj = async (supabase: any, cnpj: string, userId: string) => {
  if (!cnpj) return null
  
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  const cnpjComMascara = formatarCnpjComMascara(cnpjLimpo)
  
  const { data: fornecedor, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("user_id", userId)
    .or(`cnpj_cpf.eq.${cnpjLimpo},cnpj_cpf.eq.${cnpjComMascara}`)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return fornecedor
}

// Função para formatar CPF com máscara
export const formatarCpfComMascara = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/[^\d]/g, '')
  if (cpfLimpo.length !== 11) return cpf
  
  return cpfLimpo.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  )
}

// Função para formatar data
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj)
}

// Função para buscar produtor por CPF/CNPJ (ambos formatos)
export const findProdutorByCpfCnpj = async (supabase: any, cpfCnpj: string) => {
  if (!cpfCnpj) return null
  
  try {
    // Get current user to pass to the function
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    console.log('Buscando produtor para CPF/CNPJ:', cpfCnpj, 'usuário:', user.id)
    
    // Use the new security definer function that bypasses RLS
    const { data: produtores, error } = await supabase.rpc('find_produtor_for_import', {
      _cpf_cnpj: cpfCnpj,
      _requesting_user_id: user.id
    })

    if (error) {
      console.error('Erro na busca do produtor:', error)
      throw error
    }

    const produtor = produtores?.[0] || null
    console.log('Resultado da busca:', produtor)
    
    return produtor
  } catch (error) {
    console.error('Erro ao buscar produtor:', error)
    throw error
  }
}
