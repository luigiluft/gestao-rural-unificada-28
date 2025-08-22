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

// Função para buscar produtor por CPF/CNPJ (ambos formatos)
export const findProdutorByCpfCnpj = async (supabase: any, cpfCnpj: string) => {
  if (!cpfCnpj) return null
  
  const cpfCnpjLimpo = cpfCnpj.replace(/[^\d]/g, '')
  let cpfCnpjComMascara = ''
  
  if (cpfCnpjLimpo.length === 11) {
    // É CPF
    cpfCnpjComMascara = formatarCpfComMascara(cpfCnpjLimpo)
  } else if (cpfCnpjLimpo.length === 14) {
    // É CNPJ
    cpfCnpjComMascara = formatarCnpjComMascara(cpfCnpjLimpo)
  } else {
    return null
  }
  
  const { data: produtor, error } = await supabase
    .from("profiles")
    .select("user_id, nome, email, cpf_cnpj, role")
    .eq("role", "produtor")
    .or(`cpf_cnpj.eq.${cpfCnpjLimpo},cpf_cnpj.eq.${cpfCnpjComMascara}`)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return produtor
}
