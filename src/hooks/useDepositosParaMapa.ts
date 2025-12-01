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
  
  return `${cidadeNormalizada}_${estado.toUpperCase()}`;
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
