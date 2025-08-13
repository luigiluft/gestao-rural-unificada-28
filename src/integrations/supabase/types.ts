export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chamados_suporte: {
        Row: {
          categoria: string | null
          created_at: string
          data_resposta: string | null
          descricao: string
          id: string
          prioridade: string | null
          resposta: string | null
          status: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_resposta?: string | null
          descricao: string
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_resposta?: string | null
          descricao?: string
          id?: string
          prioridade?: string | null
          resposta?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      depositos: {
        Row: {
          ativo: boolean | null
          capacidade_total: number | null
          created_at: string
          descricao: string | null
          endereco: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade_total?: number | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          capacidade_total?: number | null
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entrada_itens: {
        Row: {
          created_at: string
          data_validade: string | null
          entrada_id: string
          id: string
          lote: string | null
          produto_id: string
          quantidade: number
          user_id: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          data_validade?: string | null
          entrada_id: string
          id?: string
          lote?: string | null
          produto_id: string
          quantidade: number
          user_id: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          data_validade?: string | null
          entrada_id?: string
          id?: string
          lote?: string | null
          produto_id?: string
          quantidade?: number
          user_id?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entrada_itens_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrada_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          chave_nfe: string | null
          created_at: string
          data_emissao: string | null
          data_entrada: string
          deposito_id: string
          fornecedor_id: string | null
          id: string
          numero_nfe: string | null
          observacoes: string | null
          status: string | null
          updated_at: string
          user_id: string
          valor_total: number | null
          xml_content: string | null
        }
        Insert: {
          chave_nfe?: string | null
          created_at?: string
          data_emissao?: string | null
          data_entrada: string
          deposito_id: string
          fornecedor_id?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          valor_total?: number | null
          xml_content?: string | null
        }
        Update: {
          chave_nfe?: string | null
          created_at?: string
          data_emissao?: string | null
          data_entrada?: string
          deposito_id?: string
          fornecedor_id?: string | null
          id?: string
          numero_nfe?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entradas_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entradas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          data_validade: string | null
          deposito_id: string
          id: string
          lote: string | null
          produto_id: string
          quantidade_atual: number
          quantidade_disponivel: number | null
          quantidade_reservada: number
          updated_at: string
          user_id: string
          valor_medio: number | null
        }
        Insert: {
          data_validade?: string | null
          deposito_id: string
          id?: string
          lote?: string | null
          produto_id: string
          quantidade_atual?: number
          quantidade_disponivel?: number | null
          quantidade_reservada?: number
          updated_at?: string
          user_id: string
          valor_medio?: number | null
        }
        Update: {
          data_validade?: string | null
          deposito_id?: string
          id?: string
          lote?: string | null
          produto_id?: string
          quantidade_atual?: number
          quantidade_disponivel?: number | null
          quantidade_reservada?: number
          updated_at?: string
          user_id?: string
          valor_medio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          ie: string | null
          nome: string
          nome_fantasia: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          ie?: string | null
          nome: string
          nome_fantasia?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          ie?: string | null
          nome?: string
          nome_fantasia?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string
          data_movimentacao: string
          deposito_id: string
          id: string
          lote: string | null
          observacoes: string | null
          produto_id: string
          quantidade: number
          referencia_id: string | null
          referencia_tipo: string | null
          tipo_movimentacao: string
          user_id: string
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          data_movimentacao?: string
          deposito_id: string
          id?: string
          lote?: string | null
          observacoes?: string | null
          produto_id: string
          quantidade: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimentacao: string
          user_id: string
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          data_movimentacao?: string
          deposito_id?: string
          id?: string
          lote?: string | null
          observacoes?: string | null
          produto_id?: string
          quantidade?: number
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo_movimentacao?: string
          user_id?: string
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invite_token: string | null
          inviter_user_id: string
          parent_user_id: string | null
          permissions: Database["public"]["Enums"]["permission_code"][]
          role: Database["public"]["Enums"]["app_role"] | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          inviter_user_id: string
          parent_user_id?: string | null
          permissions?: Database["public"]["Enums"]["permission_code"][]
          role?: Database["public"]["Enums"]["app_role"] | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          inviter_user_id?: string
          parent_user_id?: string | null
          permissions?: Database["public"]["Enums"]["permission_code"][]
          role?: Database["public"]["Enums"]["app_role"] | null
          used_at?: string | null
        }
        Relationships: []
      }
      produtores: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          codigo: string | null
          created_at: string
          descricao: string | null
          id: string
          ncm: string | null
          nome: string
          unidade_medida: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ncm?: string | null
          nome: string
          unidade_medida: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ncm?: string | null
          nome?: string
          unidade_medida?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rastreamento_historico: {
        Row: {
          data_status: string
          descricao: string | null
          id: string
          localizacao: string | null
          rastreamento_id: string
          status: string
        }
        Insert: {
          data_status?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          rastreamento_id: string
          status: string
        }
        Update: {
          data_status?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          rastreamento_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreamento_historico_rastreamento_id_fkey"
            columns: ["rastreamento_id"]
            isOneToOne: false
            referencedRelation: "rastreamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      rastreamentos: {
        Row: {
          codigo_rastreamento: string | null
          created_at: string
          data_prevista_entrega: string | null
          id: string
          saida_id: string | null
          status_atual: string | null
          transportadora: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_rastreamento?: string | null
          created_at?: string
          data_prevista_entrega?: string | null
          id?: string
          saida_id?: string | null
          status_atual?: string | null
          transportadora?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_rastreamento?: string | null
          created_at?: string
          data_prevista_entrega?: string | null
          id?: string
          saida_id?: string | null
          status_atual?: string | null
          transportadora?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rastreamentos_saida_id_fkey"
            columns: ["saida_id"]
            isOneToOne: false
            referencedRelation: "saidas"
            referencedColumns: ["id"]
          },
        ]
      }
      saida_itens: {
        Row: {
          created_at: string
          id: string
          lote: string | null
          produto_id: string
          quantidade: number
          saida_id: string
          user_id: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lote?: string | null
          produto_id: string
          quantidade: number
          saida_id: string
          user_id: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lote?: string | null
          produto_id?: string
          quantidade?: number
          saida_id?: string
          user_id?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saida_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saida_itens_saida_id_fkey"
            columns: ["saida_id"]
            isOneToOne: false
            referencedRelation: "saidas"
            referencedColumns: ["id"]
          },
        ]
      }
      saidas: {
        Row: {
          created_at: string
          data_saida: string
          deposito_id: string
          destinatario: string | null
          id: string
          observacoes: string | null
          status: string | null
          tipo_saida: string
          updated_at: string
          user_id: string
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          data_saida: string
          deposito_id: string
          destinatario?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo_saida: string
          updated_at?: string
          user_id: string
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          data_saida?: string
          deposito_id?: string
          destinatario?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo_saida?: string
          updated_at?: string
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "saidas_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hierarchy: {
        Row: {
          child_user_id: string
          created_at: string
          id: string
          parent_user_id: string
        }
        Insert: {
          child_user_id: string
          created_at?: string
          id?: string
          parent_user_id: string
        }
        Update: {
          child_user_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission_code"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["permission_code"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_code"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_user_data: {
        Args: { _viewer: string; _owner: string }
        Returns: boolean
      }
      check_user_role_safe: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      complete_invite_signup: {
        Args: { _user_id: string; _email: string }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _user_id: string
          _perm: Database["public"]["Enums"]["permission_code"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_ancestor: {
        Args: { _parent: string; _child: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "franqueado" | "produtor"
      permission_code:
        | "estoque.view"
        | "estoque.manage"
        | "entradas.manage"
        | "saidas.manage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "franqueado", "produtor"],
      permission_code: [
        "estoque.view",
        "estoque.manage",
        "entradas.manage",
        "saidas.manage",
      ],
    },
  },
} as const
