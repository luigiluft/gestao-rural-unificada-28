import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteDriverData {
  email: string;
  cpf: string;
  nome: string;
}

export const useInviteDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteDriverData) => {
      // First, create or update the motorista record
      const { data: existingDriver, error: searchError } = await supabase
        .from('motoristas')
        .select('id, auth_user_id')
        .eq('cpf', data.cpf)
        .maybeSingle();

      if (searchError) throw searchError;

      let driverId: string;

      if (existingDriver) {
        if (existingDriver.auth_user_id) {
          throw new Error('Este motorista já possui acesso ao sistema');
        }
        driverId = existingDriver.id;
      } else {
        // Create new driver record
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: newDriver, error: createError } = await supabase
          .from('motoristas')
          .insert({
            nome: data.nome,
            cpf: data.cpf,
            cnh: 'A ser informado', // Temporary placeholder
            user_id: user.id,
            email: data.email,
            ativo: true
          })
          .select('id')
          .single();

        if (createError) throw createError;
        driverId = newDriver.id;
      }

      // Get current user again for invitation
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Usuário não autenticado');

      // Create invitation - simplified without metadata for now
      const { data: invitation, error: inviteError } = await supabase
        .from('pending_invites')
        .insert({
          email: data.email,
          role: 'motorista' as any,
          invite_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          inviter_user_id: currentUser.id
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      return { invitation, driverId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["motoristas"] });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao enviar convite:", error);
      toast.error(error.message || "Erro ao enviar convite");
    },
  });
};

export const useAcceptDriverInvitation = () => {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      // Get invitation details
      const { data: invite, error: inviteError } = await supabase
        .from('pending_invites')
        .select('*')
        .eq('invite_token', token)
        .eq('used_at', null)
        .single();

      if (inviteError || !invite) {
        throw new Error('Convite inválido ou expirado');
      }

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Convite expirado');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/motorista/login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          role: 'motorista' as any,
          email: invite.email,
          nome: 'Motorista'
        });

      if (profileError) throw profileError;

      // Link driver to auth user - for now we'll need to handle this manually
      // Will be improved in future iterations

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('pending_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      return authData;
    },
    onSuccess: () => {
      toast.success("Conta criada com sucesso! Faça login para continuar.");
    },
    onError: (error: any) => {
      console.error("Erro ao aceitar convite:", error);
      toast.error(error.message || "Erro ao aceitar convite");
    },
  });
};