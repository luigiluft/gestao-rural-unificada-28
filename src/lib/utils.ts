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
