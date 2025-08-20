export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allocation_wave_items: {
        Row: {
          alocado_por: string | null
          barcode_posicao: string | null
          barcode_produto: string | null
          created_at: string
          data_alocacao: string | null
          entrada_item_id: string
          id: string
          lote: string | null
          posicao_id: string | null
          produto_id: string
          quantidade: number
          quantidade_alocada: number | null
          status: string
          updated_at: string
          wave_id: string
        }
        Insert: {
          alocado_por?: string | null
          barcode_posicao?: string | null
          barcode_produto?: string | null
          created_at?: string
          data_alocacao?: string | null
          entrada_item_id: string
          id?: string
          lote?: string | null
          posicao_id?: string | null
          produto_id: string
          quantidade: number
          quantidade_alocada?: number | null
          status?: string
          updated_at?: string
          wave_id: string
        }
        Update: {
          alocado_por?: string | null
          barcode_posicao?: string | null
          barcode_produto?: string | null
          created_at?: string
          data_alocacao?: string | null
          entrada_item_id?: string
          id?: string
          lote?: string | null
          posicao_id?: string | null
          produto_id?: string
          quantidade?: number
          quantidade_alocada?: number | null
          status?: string
          updated_at?: string
          wave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocation_wave_items_entrada_item_id"
            columns: ["entrada_item_id"]
            isOneToOne: false
            referencedRelation: "entrada_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_wave_items_posicao_id"
            columns: ["posicao_id"]
            isOneToOne: false
            referencedRelation: "storage_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_wave_items_produto_id"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_allocation_wave_items_wave_id"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "allocation_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_waves: {
        Row: {
          created_at: string
          created_by: string
          data_conclusao: string | null
          data_criacao: string
          data_inicio: string | null
          deposito_id: string
          funcionario_id: string | null
          id: string
          numero_onda: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio?: string | null
          deposito_id: string
          funcionario_id?: string | null
          id?: string
          numero_onda: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_conclusao?: string | null
          data_criacao?: string
          data_inicio?: string | null
          deposito_id?: string
          funcionario_id?: string | null
          id?: string
          numero_onda?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_allocation_waves_deposito_id"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "franquias"
            referencedColumns: ["id"]
          },
        ]
      }
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
          codigo_produto: string | null
          created_at: string
          data_fabricacao: string | null
          data_validade: string | null
          entrada_id: string
          id: string
          lote: string | null
          nome_produto: string | null
          produto_id: string | null
          quantidade: number
          quantidade_lote: number | null
          user_id: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          codigo_produto?: string | null
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          entrada_id: string
          id?: string
          lote?: string | null
          nome_produto?: string | null
          produto_id?: string | null
          quantidade: number
          quantidade_lote?: number | null
          user_id: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          codigo_produto?: string | null
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          entrada_id?: string
          id?: string
          lote?: string | null
          nome_produto?: string | null
          produto_id?: string | null
          quantidade?: number
          quantidade_lote?: number | null
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
      entrada_status_historico: {
        Row: {
          created_at: string
          entrada_id: string
          id: string
          observacoes: string | null
          status_anterior: Database["public"]["Enums"]["entrada_status"] | null
          status_novo: Database["public"]["Enums"]["entrada_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entrada_id: string
          id?: string
          observacoes?: string | null
          status_anterior?: Database["public"]["Enums"]["entrada_status"] | null
          status_novo: Database["public"]["Enums"]["entrada_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          entrada_id?: string
          id?: string
          observacoes?: string | null
          status_anterior?: Database["public"]["Enums"]["entrada_status"] | null
          status_novo?: Database["public"]["Enums"]["entrada_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrada_status_historico_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          aprovado_por: string | null
          chave_nfe: string | null
          created_at: string
          data_aprovacao: string | null
          data_emissao: string | null
          data_entrada: string
          deposito_id: string | null
          destinatario_cpf_cnpj: string | null
          divergencias: Json | null
          emitente_cnpj: string | null
          emitente_endereco: string | null
          emitente_nome: string | null
          fornecedor_id: string | null
          id: string
          natureza_operacao: string | null
          numero_nfe: string | null
          observacoes: string | null
          observacoes_franqueado: string | null
          serie: string | null
          status_aprovacao: Database["public"]["Enums"]["entrada_status"] | null
          updated_at: string
          user_id: string
          valor_total: number | null
          xml_content: string | null
        }
        Insert: {
          aprovado_por?: string | null
          chave_nfe?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_emissao?: string | null
          data_entrada: string
          deposito_id?: string | null
          destinatario_cpf_cnpj?: string | null
          divergencias?: Json | null
          emitente_cnpj?: string | null
          emitente_endereco?: string | null
          emitente_nome?: string | null
          fornecedor_id?: string | null
          id?: string
          natureza_operacao?: string | null
          numero_nfe?: string | null
          observacoes?: string | null
          observacoes_franqueado?: string | null
          serie?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["entrada_status"]
            | null
          updated_at?: string
          user_id: string
          valor_total?: number | null
          xml_content?: string | null
        }
        Update: {
          aprovado_por?: string | null
          chave_nfe?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_emissao?: string | null
          data_entrada?: string
          deposito_id?: string | null
          destinatario_cpf_cnpj?: string | null
          divergencias?: Json | null
          emitente_cnpj?: string | null
          emitente_endereco?: string | null
          emitente_nome?: string | null
          fornecedor_id?: string | null
          id?: string
          natureza_operacao?: string | null
          numero_nfe?: string | null
          observacoes?: string | null
          observacoes_franqueado?: string | null
          serie?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["entrada_status"]
            | null
          updated_at?: string
          user_id?: string
          valor_total?: number | null
          xml_content?: string | null
        }
        Relationships: [
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
            foreignKeyName: "estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fazendas: {
        Row: {
          area_total_ha: number | null
          ativo: boolean
          bairro: string | null
          cadastro_ambiental_rural: string | null
          capacidade_armazenagem_ton: number | null
          cep: string | null
          cidade: string | null
          codigo_ibge_municipio: string | null
          codigo_imovel_rural: string | null
          complemento: string | null
          cpf_cnpj_proprietario: string | null
          created_at: string
          email_contato: string | null
          endereco: string
          estado: string | null
          id: string
          infraestrutura: string | null
          inscricao_estadual: string | null
          latitude: number | null
          longitude: number | null
          municipio: string | null
          nome: string
          nome_logradouro: string | null
          nome_responsavel: string | null
          numero: string | null
          produtor_id: string
          referencia: string | null
          situacao_cadastral: string | null
          telefone_contato: string | null
          tipo_logradouro: string | null
          tipo_producao: string | null
          uf: string | null
          uf_ie: string | null
          updated_at: string
        }
        Insert: {
          area_total_ha?: number | null
          ativo?: boolean
          bairro?: string | null
          cadastro_ambiental_rural?: string | null
          capacidade_armazenagem_ton?: number | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge_municipio?: string | null
          codigo_imovel_rural?: string | null
          complemento?: string | null
          cpf_cnpj_proprietario?: string | null
          created_at?: string
          email_contato?: string | null
          endereco: string
          estado?: string | null
          id?: string
          infraestrutura?: string | null
          inscricao_estadual?: string | null
          latitude?: number | null
          longitude?: number | null
          municipio?: string | null
          nome: string
          nome_logradouro?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          produtor_id: string
          referencia?: string | null
          situacao_cadastral?: string | null
          telefone_contato?: string | null
          tipo_logradouro?: string | null
          tipo_producao?: string | null
          uf?: string | null
          uf_ie?: string | null
          updated_at?: string
        }
        Update: {
          area_total_ha?: number | null
          ativo?: boolean
          bairro?: string | null
          cadastro_ambiental_rural?: string | null
          capacidade_armazenagem_ton?: number | null
          cep?: string | null
          cidade?: string | null
          codigo_ibge_municipio?: string | null
          codigo_imovel_rural?: string | null
          complemento?: string | null
          cpf_cnpj_proprietario?: string | null
          created_at?: string
          email_contato?: string | null
          endereco?: string
          estado?: string | null
          id?: string
          infraestrutura?: string | null
          inscricao_estadual?: string | null
          latitude?: number | null
          longitude?: number | null
          municipio?: string | null
          nome?: string
          nome_logradouro?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          produtor_id?: string
          referencia?: string | null
          situacao_cadastral?: string | null
          telefone_contato?: string | null
          tipo_logradouro?: string | null
          tipo_producao?: string | null
          uf?: string | null
          uf_ie?: string | null
          updated_at?: string
        }
        Relationships: []
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
      franquias: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          capacidade_total: number | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          codigo_interno: string | null
          complemento: string | null
          created_at: string | null
          descricao: string | null
          descricao_deposito: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          layout_armazem: string | null
          master_franqueado_id: string
          nome: string
          numero: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          capacidade_total?: number | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_interno?: string | null
          complemento?: string | null
          created_at?: string | null
          descricao?: string | null
          descricao_deposito?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          layout_armazem?: string | null
          master_franqueado_id: string
          nome: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          capacidade_total?: number | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_interno?: string | null
          complemento?: string | null
          created_at?: string | null
          descricao?: string | null
          descricao_deposito?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          layout_armazem?: string | null
          master_franqueado_id?: string
          nome?: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventario_divergencias: {
        Row: {
          created_at: string
          diferenca: number
          id: string
          inventario_id: string
          justificativa: string | null
          lote: string | null
          posicao_id: string
          produto_id: string | null
          quantidade_encontrada: number
          quantidade_sistema: number
          status: string
          tipo_divergencia: string
          valor_impacto: number | null
        }
        Insert: {
          created_at?: string
          diferenca: number
          id?: string
          inventario_id: string
          justificativa?: string | null
          lote?: string | null
          posicao_id: string
          produto_id?: string | null
          quantidade_encontrada: number
          quantidade_sistema: number
          status?: string
          tipo_divergencia: string
          valor_impacto?: number | null
        }
        Update: {
          created_at?: string
          diferenca?: number
          id?: string
          inventario_id?: string
          justificativa?: string | null
          lote?: string | null
          posicao_id?: string
          produto_id?: string | null
          quantidade_encontrada?: number
          quantidade_sistema?: number
          status?: string
          tipo_divergencia?: string
          valor_impacto?: number | null
        }
        Relationships: []
      }
      inventario_itens: {
        Row: {
          codigo_barras: string | null
          created_at: string
          data_escaneamento: string | null
          diferenca: number | null
          id: string
          inventario_id: string
          lote: string | null
          observacoes: string | null
          posicao_id: string
          produto_id: string | null
          quantidade_encontrada: number
          quantidade_sistema: number
          scaneado_por: string | null
          valor_unitario: number | null
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string
          data_escaneamento?: string | null
          diferenca?: number | null
          id?: string
          inventario_id: string
          lote?: string | null
          observacoes?: string | null
          posicao_id: string
          produto_id?: string | null
          quantidade_encontrada?: number
          quantidade_sistema?: number
          scaneado_por?: string | null
          valor_unitario?: number | null
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string
          data_escaneamento?: string | null
          diferenca?: number | null
          id?: string
          inventario_id?: string
          lote?: string | null
          observacoes?: string | null
          posicao_id?: string
          produto_id?: string | null
          quantidade_encontrada?: number
          quantidade_sistema?: number
          scaneado_por?: string | null
          valor_unitario?: number | null
        }
        Relationships: []
      }
      inventario_posicoes: {
        Row: {
          conferido_por: string | null
          created_at: string
          data_conclusao: string | null
          data_inicio: string | null
          id: string
          inventario_id: string
          posicao_id: string
          status: string
        }
        Insert: {
          conferido_por?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          inventario_id: string
          posicao_id: string
          status?: string
        }
        Update: {
          conferido_por?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          id?: string
          inventario_id?: string
          posicao_id?: string
          status?: string
        }
        Relationships: []
      }
      inventarios: {
        Row: {
          created_at: string
          created_by: string
          data_conclusao: string | null
          data_inicio: string
          deposito_id: string
          id: string
          numero_inventario: string
          observacoes: string | null
          posicoes_conferidas: number | null
          status: Database["public"]["Enums"]["inventory_status"]
          total_posicoes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_conclusao?: string | null
          data_inicio?: string
          deposito_id: string
          id?: string
          numero_inventario: string
          observacoes?: string | null
          posicoes_conferidas?: number | null
          status?: Database["public"]["Enums"]["inventory_status"]
          total_posicoes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_conclusao?: string | null
          data_inicio?: string
          deposito_id?: string
          id?: string
          numero_inventario?: string
          observacoes?: string | null
          posicoes_conferidas?: number | null
          status?: Database["public"]["Enums"]["inventory_status"]
          total_posicoes?: number | null
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
            foreignKeyName: "movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      page_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          visible_in_menu: boolean
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          visible_in_menu?: boolean
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          page_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          visible_in_menu?: boolean
        }
        Relationships: []
      }
      pending_invites: {
        Row: {
          created_at: string
          email: string
          franquia_id: string | null
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
          franquia_id?: string | null
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
          franquia_id?: string | null
          id?: string
          invite_token?: string | null
          inviter_user_id?: string
          parent_user_id?: string | null
          permissions?: Database["public"]["Enums"]["permission_code"][]
          role?: Database["public"]["Enums"]["app_role"] | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_invites_franquia_id_fkey"
            columns: ["franquia_id"]
            isOneToOne: false
            referencedRelation: "franquias"
            referencedColumns: ["id"]
          },
        ]
      }
      produtor_franqueado_depositos: {
        Row: {
          ativo: boolean
          created_at: string
          data_autorizacao: string
          deposito_id: string
          franqueado_id: string
          id: string
          produtor_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_autorizacao?: string
          deposito_id: string
          franqueado_id: string
          id?: string
          produtor_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_autorizacao?: string
          deposito_id?: string
          franqueado_id?: string
          id?: string
          produtor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtores: {
        Row: {
          ativo: boolean
          created_at: string
          franquia_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          franquia_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          franquia_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtores_franquia_id_fkey"
            columns: ["franquia_id"]
            isOneToOne: false
            referencedRelation: "franquias"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
          role: Database["public"]["Enums"]["app_role"]
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
          role?: Database["public"]["Enums"]["app_role"]
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
          quantidade_separada: number | null
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
          quantidade_separada?: number | null
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
          quantidade_separada?: number | null
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
      saida_status_historico: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          saida_id: string
          status_anterior: Database["public"]["Enums"]["saida_status"] | null
          status_novo: Database["public"]["Enums"]["saida_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          saida_id: string
          status_anterior?: Database["public"]["Enums"]["saida_status"] | null
          status_novo: Database["public"]["Enums"]["saida_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          saida_id?: string
          status_anterior?: Database["public"]["Enums"]["saida_status"] | null
          status_novo?: Database["public"]["Enums"]["saida_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saida_status_historico_saida_id_fkey"
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
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["saida_status"] | null
          tipo_saida: string
          updated_at: string
          user_id: string
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          data_saida: string
          deposito_id: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["saida_status"] | null
          tipo_saida: string
          updated_at?: string
          user_id: string
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          data_saida?: string
          deposito_id?: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["saida_status"] | null
          tipo_saida?: string
          updated_at?: string
          user_id?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      storage_positions: {
        Row: {
          ativo: boolean | null
          capacidade_maxima: number | null
          codigo: string
          created_at: string
          deposito_id: string
          descricao: string | null
          id: string
          ocupado: boolean | null
          tipo_posicao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade_maxima?: number | null
          codigo: string
          created_at?: string
          deposito_id: string
          descricao?: string | null
          id?: string
          ocupado?: boolean | null
          tipo_posicao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          capacidade_maxima?: number | null
          codigo?: string
          created_at?: string
          deposito_id?: string
          descricao?: string | null
          id?: string
          ocupado?: boolean | null
          tipo_posicao?: string | null
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_allocate_positions: {
        Args: { p_wave_id: string }
        Returns: boolean
      }
      can_create_role: {
        Args: {
          _creator_user_id: string
          _target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      can_view_user_data: {
        Args: { _owner: string; _viewer: string }
        Returns: boolean
      }
      check_user_role_safe: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      complete_allocation_and_create_stock: {
        Args: {
          p_barcode_posicao: string
          p_barcode_produto: string
          p_posicao_id: string
          p_wave_item_id: string
        }
        Returns: boolean
      }
      complete_invite_signup: {
        Args: { _email: string; _user_id: string }
        Returns: boolean
      }
      generate_inventory_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_producer_available_deposits: {
        Args: { _producer_id: string }
        Returns: {
          deposito_id: string
          deposito_nome: string
          franqueado_id: string
          franqueado_nome: string
        }[]
      }
      get_user_franquia: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_franquia_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_permission: {
        Args: {
          _perm: Database["public"]["Enums"]["permission_code"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ancestor: {
        Args: { _child: string; _parent: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "franqueado" | "produtor"
      entrada_status:
        | "aguardando_transporte"
        | "em_transferencia"
        | "aguardando_conferencia"
        | "conferencia_completa"
        | "confirmado"
        | "rejeitado"
      inventory_status: "iniciado" | "em_andamento" | "concluido" | "cancelado"
      permission_code:
        | "estoque.view"
        | "estoque.manage"
        | "entradas.manage"
        | "saidas.manage"
      saida_status: "separacao_pendente" | "separado" | "expedido" | "entregue"
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
      entrada_status: [
        "aguardando_transporte",
        "em_transferencia",
        "aguardando_conferencia",
        "conferencia_completa",
        "confirmado",
        "rejeitado",
      ],
      inventory_status: ["iniciado", "em_andamento", "concluido", "cancelado"],
      permission_code: [
        "estoque.view",
        "estoque.manage",
        "entradas.manage",
        "saidas.manage",
      ],
      saida_status: ["separacao_pendente", "separado", "expedido", "entregue"],
    },
  },
} as const
