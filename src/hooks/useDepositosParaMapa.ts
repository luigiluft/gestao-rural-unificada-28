import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DepositoMapa {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  tipo_deposito: string;
  svgId: string;
}

// Mapeamento de fallback para variações comuns de escrita sem acentos
const MAPEAMENTO_MUNICIPIOS: Record<string, string> = {
  "Aparecida_de_Goiania_GO": "Aparecida_de_Goiânia_GO",
  "Araguaina_TO": "Araguaína_TO",
  "Luis_Eduardo_Magalhaes_BA": "Luís_Eduardo_Magalhães_BA",
  "Ibipora_PR": "Ibiporã_PR",
  "Uberlandia_MG": "Uberlândia_MG",
};

const normalizarParaSvgId = (cidade: string, estado: string): string => {
  // Mantém acentos e capitaliza corretamente (preposições em minúsculo)
  const preposicoes = ['de', 'do', 'da', 'dos', 'das'];
  
  const cidadeNormalizada = cidade
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const wordLower = word.toLowerCase();
      // Primeira palavra sempre capitalizada, preposições em minúsculo
      if (index === 0 || !preposicoes.includes(wordLower)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return wordLower;
    })
    .join("_");
  
  const svgIdBase = `${cidadeNormalizada}_${estado.toUpperCase()}`;
  
  // Verificar se existe mapeamento de correção para variações sem acento
  return MAPEAMENTO_MUNICIPIOS[svgIdBase] || svgIdBase;
};

export const useDepositosParaMapa = () => {
  return useQuery({
    queryKey: ["depositos-mapa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("franquias")
        .select("id, nome, cidade, estado, tipo_deposito")
        .eq("ativo", true)
        .not("cidade", "is", null)
        .not("estado", "is", null);

      if (error) throw error;

      const depositosComSvgId: DepositoMapa[] = (data || []).map((deposito) => ({
        ...deposito,
        svgId: normalizarParaSvgId(deposito.cidade!, deposito.estado!),
      }));

      console.log("📍 DEPOSITOS PARA MAPA:", depositosComSvgId);
      return depositosComSvgId;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
