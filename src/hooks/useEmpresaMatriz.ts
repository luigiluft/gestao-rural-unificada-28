import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmpresaMatrizData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  horario_funcionamento: string;
}

const defaultData: EmpresaMatrizData = {
  razao_social: "Luft AgroHub Ltda",
  nome_fantasia: "Luft AgroHub",
  cnpj: "",
  email: "contato@luftagrohub.com.br",
  telefone: "(43) 99999-9999",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Londrina",
  estado: "PR",
  cep: "",
  horario_funcionamento: "Seg - Sex: 8h às 18h"
};

export const useEmpresaMatriz = () => {
  return useQuery({
    queryKey: ["empresa-matriz"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_sistema")
        .select("chave, valor")
        .like("chave", "empresa_matriz_%");

      if (error) {
        console.error("Erro ao buscar dados da empresa matriz:", error);
        return defaultData;
      }

      const config: EmpresaMatrizData = { ...defaultData };
      
      data?.forEach((item) => {
        const key = item.chave.replace("empresa_matriz_", "") as keyof EmpresaMatrizData;
        if (key in config) {
          config[key] = item.valor;
        }
      });

      return config;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const getEnderecoCompleto = (data: EmpresaMatrizData): string => {
  const parts = [];
  if (data.endereco) {
    let endereco = data.endereco;
    if (data.numero) endereco += `, ${data.numero}`;
    if (data.complemento) endereco += ` - ${data.complemento}`;
    parts.push(endereco);
  }
  if (data.bairro) parts.push(data.bairro);
  if (data.cidade && data.estado) {
    parts.push(`${data.cidade}, ${data.estado}`);
  } else if (data.cidade) {
    parts.push(data.cidade);
  }
  return parts.join(" - ") || "Londrina, PR - Brasil";
};

export const getEnderecoResumido = (data: EmpresaMatrizData): string => {
  if (data.cidade && data.estado) {
    return `${data.cidade}, ${data.estado} - Brasil`;
  }
  return "Londrina, PR - Brasil";
};
