import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export interface Atendimento {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string | null;
  prioridade: string | null;
  status: string | null;
  resposta: string | null;
  data_resposta: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  origem: string;
  nome_contato: string | null;
  email_contato: string | null;
  telefone_contato: string | null;
  empresa_contato: string | null;
}

export const useAtendimentos = () => {
  const { user } = useAuth();
  const { selectedCliente } = useCliente();
  const { isCliente, isAdmin } = useUserRole();

  return useQuery({
    queryKey: ["atendimentos", user?.id, selectedCliente?.id, isCliente],
    queryFn: async () => {
      let query = supabase
        .from("chamados_suporte")
        .select("*")
        .order("created_at", { ascending: false });

      // Se for cliente, filtrar por cliente selecionado (atendimentos da loja)
      if (isCliente && selectedCliente?.id) {
        query = query.eq("user_id", selectedCliente.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Atendimento[];
    },
    enabled: !!user,
  });
};

export const useCreateAtendimento = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      descricao: string;
      categoria?: string;
      prioridade?: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("chamados_suporte")
        .insert({
          ...data,
          user_id: user.id,
          origem: "interno",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      toast.success("Atendimento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar atendimento: " + error.message);
    },
  });
};

export const useUpdateAtendimento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      resposta?: string;
      prioridade?: string;
    }) => {
      const updateData: Record<string, unknown> = { ...data };
      if (data.resposta) {
        updateData.data_resposta = new Date().toISOString();
      }

      const { data: result, error } = await supabase
        .from("chamados_suporte")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      toast.success("Atendimento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });
};

// For public contact form (anonymous)
export const createPublicAtendimento = async (data: {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  assunto: string;
  mensagem: string;
}) => {
  const { error } = await supabase.from("chamados_suporte").insert({
    titulo: data.assunto,
    descricao: data.mensagem,
    user_id: "00000000-0000-0000-0000-000000000000", // placeholder for anonymous
    origem: "site",
    nome_contato: data.nome,
    email_contato: data.email,
    telefone_contato: data.telefone || null,
    empresa_contato: data.empresa || null,
    categoria: "contato_site",
    prioridade: "media",
  });

  if (error) throw error;
  return true;
};

// Hook para buscar atendimentos de um cliente específico (para página Atendimento do cliente)
export const useAtendimentosCliente = (clienteId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["atendimentos-cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados_suporte")
        .select("*")
        .eq("user_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Atendimento[];
    },
    enabled: !!user && !!clienteId,
  });
};
