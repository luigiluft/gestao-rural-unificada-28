import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useInviteLink = () => {
  const [loading, setLoading] = useState(false);

  const generateInviteLink = async (inviteId: string) => {
    setLoading(true);
    try {
      // Buscar o token do convite
      const { data: invite, error } = await supabase
        .from('pending_invites')
        .select('invite_token')
        .eq('id', inviteId)
        .single();

      if (error || !invite) {
        throw new Error('Convite não encontrado');
      }

      // Gerar link de convite
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/auth?invite_token=${invite.invite_token}`;
      
      return inviteLink;
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error('Erro ao gerar link de convite');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (inviteId: string) => {
    const link = await generateInviteLink(inviteId);
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Link copiado para área de transferência!');
      return link;
    }
    return null;
  };

  return {
    generateInviteLink,
    copyInviteLink,
    loading
  };
};