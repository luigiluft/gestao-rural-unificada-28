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
  // Remove acentos e caracteres especiais, mantém espaços como underscores
  const cidadeNormalizada = cidade
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
  
  return `${cidadeNormalizada}_${estado}`;
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
