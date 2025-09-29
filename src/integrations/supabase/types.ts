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
      comprovante_fotos: {
        Row: {
          comprovante_id: string
          created_at: string
          data_foto: string | null
          descricao: string | null
          id: string
          latitude: number | null
          longitude: number | null
          tipo: string
          url_foto: string
        }
        Insert: {
          comprovante_id: string
          created_at?: string
          data_foto?: string | null
          descricao?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          tipo: string
          url_foto: string
        }
        Update: {
          comprovante_id?: string
          created_at?: string
          data_foto?: string | null
          descricao?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          tipo?: string
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovante_fotos_comprovante_id_fkey"
            columns: ["comprovante_id"]
            isOneToOne: false
            referencedRelation: "comprovantes_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      comprovantes_entrega: {
        Row: {
          cliente_nome: string
          codigo: string
          created_at: string
          data_entrega: string | null
          documento_recebedor: string | null
          id: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          observacoes: string | null
          produto_descricao: string | null
          recebido_por: string | null
          status: string
          tem_assinatura: boolean
          total_fotos: number
          tracking_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_nome: string
          codigo: string
          created_at?: string
          data_entrega?: string | null
          documento_recebedor?: string | null
          id?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          observacoes?: string | null
          produto_descricao?: string | null
          recebido_por?: string | null
          status?: string
          tem_assinatura?: boolean
          total_fotos?: number
          tracking_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_nome?: string
          codigo?: string
          created_at?: string
          data_entrega?: string | null
          documento_recebedor?: string | null
          id?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          observacoes?: string | null
          produto_descricao?: string | null
          recebido_por?: string | null
          status?: string
          tem_assinatura?: boolean
          total_fotos?: number
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          created_at: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          comprovante_id: string
          created_at: string
          id: string
          motorista_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          comprovante_id: string
          created_at?: string
          id?: string
          motorista_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          comprovante_id?: string
          created_at?: string
          id?: string
          motorista_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_comprovante_id_fkey"
            columns: ["comprovante_id"]
            isOneToOne: false
            referencedRelation: "comprovantes_entrega"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_motorista_id_fkey"
            columns: ["motorista_id"]
            isOneToOne: false
            referencedRelation: "motoristas"
            referencedColumns: ["id"]
          },
        ]
      }
      divergencias: {
        Row: {
          created_at: string
          data_resolucao: string | null
          deposito_id: string
          diferenca: number | null
          entrada_id: string | null
          id: string
          inventario_id: string | null
          justificativa: string | null
          lote: string | null
          observacoes: string | null
          pallet_id: string | null
          posicao_id: string | null
          prioridade: string
          produto_id: string | null
          quantidade_encontrada: number
          quantidade_esperada: number
          resolucao_aplicada: string | null
          resolvido_por: string | null
          saida_id: string | null
          status: string
          tipo_divergencia: string
          tipo_origem: string
          updated_at: string
          user_id: string
          valor_impacto: number | null
        }
        Insert: {
          created_at?: string
          data_resolucao?: string | null
          deposito_id: string
          diferenca?: number | null
          entrada_id?: string | null
          id?: string
          inventario_id?: string | null
          justificativa?: string | null
          lote?: string | null
          observacoes?: string | null
          pallet_id?: string | null
          posicao_id?: string | null
          prioridade?: string
          produto_id?: string | null
          quantidade_encontrada?: number
          quantidade_esperada?: number
          resolucao_aplicada?: string | null
          resolvido_por?: string | null
          saida_id?: string | null
          status?: string
          tipo_divergencia: string
          tipo_origem: string
          updated_at?: string
          user_id: string
          valor_impacto?: number | null
        }
        Update: {
          created_at?: string
          data_resolucao?: string | null
          deposito_id?: string
          diferenca?: number | null
          entrada_id?: string | null
          id?: string
          inventario_id?: string | null
          justificativa?: string | null
          lote?: string | null
          observacoes?: string | null
          pallet_id?: string | null
          posicao_id?: string | null
          prioridade?: string
          produto_id?: string | null
          quantidade_encontrada?: number
          quantidade_esperada?: number
          resolucao_aplicada?: string | null
          resolvido_por?: string | null
          saida_id?: string | null
          status?: string
          tipo_divergencia?: string
          tipo_origem?: string
          updated_at?: string
          user_id?: string
          valor_impacto?: number | null
        }
        Relationships: []
      }
      entrada_itens: {
        Row: {
          cest: string | null
          cfop: string | null
          codigo_ean: string | null
          codigo_ean_tributavel: string | null
          codigo_produto: string | null
          created_at: string
          data_fabricacao: string | null
          data_validade: string | null
          descricao_produto: string | null
          entrada_id: string
          id: string
          impostos_cofins: Json | null
          impostos_icms: Json | null
          impostos_ipi: Json | null
          impostos_pis: Json | null
          indicador_total: string | null
          lote: string | null
          ncm: string | null
          nome_produto: string | null
          pallets: number | null
          produto_id: string | null
          quantidade: number
          quantidade_comercial: number | null
          quantidade_lote: number | null
          quantidade_tributavel: number | null
          unidade_comercial: string | null
          unidade_tributavel: string | null
          user_id: string
          valor_total: number | null
          valor_total_tributos_item: number | null
          valor_unitario: number | null
          valor_unitario_comercial: number | null
          valor_unitario_tributavel: number | null
          volumes: number | null
          volumes_por_pallet: number | null
        }
        Insert: {
          cest?: string | null
          cfop?: string | null
          codigo_ean?: string | null
          codigo_ean_tributavel?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          descricao_produto?: string | null
          entrada_id: string
          id?: string
          impostos_cofins?: Json | null
          impostos_icms?: Json | null
          impostos_ipi?: Json | null
          impostos_pis?: Json | null
          indicador_total?: string | null
          lote?: string | null
          ncm?: string | null
          nome_produto?: string | null
          pallets?: number | null
          produto_id?: string | null
          quantidade: number
          quantidade_comercial?: number | null
          quantidade_lote?: number | null
          quantidade_tributavel?: number | null
          unidade_comercial?: string | null
          unidade_tributavel?: string | null
          user_id: string
          valor_total?: number | null
          valor_total_tributos_item?: number | null
          valor_unitario?: number | null
          valor_unitario_comercial?: number | null
          valor_unitario_tributavel?: number | null
          volumes?: number | null
          volumes_por_pallet?: number | null
        }
        Update: {
          cest?: string | null
          cfop?: string | null
          codigo_ean?: string | null
          codigo_ean_tributavel?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          descricao_produto?: string | null
          entrada_id?: string
          id?: string
          impostos_cofins?: Json | null
          impostos_icms?: Json | null
          impostos_ipi?: Json | null
          impostos_pis?: Json | null
          indicador_total?: string | null
          lote?: string | null
          ncm?: string | null
          nome_produto?: string | null
          pallets?: number | null
          produto_id?: string | null
          quantidade?: number
          quantidade_comercial?: number | null
          quantidade_lote?: number | null
          quantidade_tributavel?: number | null
          unidade_comercial?: string | null
          unidade_tributavel?: string | null
          user_id?: string
          valor_total?: number | null
          valor_total_tributos_item?: number | null
          valor_unitario?: number | null
          valor_unitario_comercial?: number | null
          valor_unitario_tributavel?: number | null
          volumes?: number | null
          volumes_por_pallet?: number | null
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
      entrada_pallet_itens: {
        Row: {
          created_at: string
          entrada_item_id: string
          id: string
          is_avaria: boolean
          pallet_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          entrada_item_id: string
          id?: string
          is_avaria?: boolean
          pallet_id: string
          quantidade?: number
        }
        Update: {
          created_at?: string
          entrada_item_id?: string
          id?: string
          is_avaria?: boolean
          pallet_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "entrada_pallet_itens_entrada_item_id_fkey"
            columns: ["entrada_item_id"]
            isOneToOne: false
            referencedRelation: "entrada_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrada_pallet_itens_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "entrada_pallets"
            referencedColumns: ["id"]
          },
        ]
      }
      entrada_pallets: {
        Row: {
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          entrada_id: string
          id: string
          numero_pallet: number
          peso_total: number | null
          quantidade_atual: number | null
          updated_at: string
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          entrada_id: string
          id?: string
          numero_pallet: number
          peso_total?: number | null
          quantidade_atual?: number | null
          updated_at?: string
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          entrada_id?: string
          id?: string
          numero_pallet?: number
          peso_total?: number | null
          quantidade_atual?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrada_pallets_entrada_id_fkey"
            columns: ["entrada_id"]
            isOneToOne: false
            referencedRelation: "entradas"
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
          cmun_fg: string | null
          cnf: string | null
          codigo_status: string | null
          created_at: string
          cuf: string | null
          data_aprovacao: string | null
          data_emissao: string | null
          data_entrada: string
          data_recebimento: string | null
          data_vencimento_duplicata: string | null
          deposito_id: string | null
          descricao_pagamento: string | null
          destinatario_bairro: string | null
          destinatario_cep: string | null
          destinatario_codigo_municipio: string | null
          destinatario_codigo_pais: string | null
          destinatario_complemento: string | null
          destinatario_cpf_cnpj: string | null
          destinatario_email: string | null
          destinatario_ie: string | null
          destinatario_ind_ie: string | null
          destinatario_logradouro: string | null
          destinatario_municipio: string | null
          destinatario_nome: string | null
          destinatario_numero: string | null
          destinatario_pais: string | null
          destinatario_telefone: string | null
          destinatario_uf: string | null
          dh_emissao: string | null
          dh_saida_entrada: string | null
          digest_value: string | null
          digito_verificador: string | null
          divergencias: Json | null
          emitente_bairro: string | null
          emitente_cep: string | null
          emitente_cnpj: string | null
          emitente_codigo_municipio: string | null
          emitente_codigo_pais: string | null
          emitente_complemento: string | null
          emitente_crt: string | null
          emitente_endereco: string | null
          emitente_ie: string | null
          emitente_logradouro: string | null
          emitente_municipio: string | null
          emitente_nome: string | null
          emitente_nome_fantasia: string | null
          emitente_numero: string | null
          emitente_telefone: string | null
          emitente_uf: string | null
          entrega_bairro: string | null
          entrega_cep: string | null
          entrega_cnpj: string | null
          entrega_logradouro: string | null
          entrega_municipio: string | null
          entrega_nome: string | null
          entrega_numero: string | null
          entrega_telefone: string | null
          entrega_uf: string | null
          finalidade_nfe: string | null
          fornecedor_id: string | null
          id: string
          id_dest: string | null
          ind_final: string | null
          ind_intermediador: string | null
          ind_pres: string | null
          indicador_pagamento: string | null
          informacoes_complementares: string | null
          modalidade_frete: string | null
          modelo: string | null
          motivo_status: string | null
          natureza_operacao: string | null
          numero_duplicata: string | null
          numero_fatura: string | null
          numero_nfe: string | null
          numero_pedido_compra: string | null
          numero_protocolo: string | null
          observacoes: string | null
          observacoes_franqueado: string | null
          peso_bruto: number | null
          peso_liquido: number | null
          processo_emissao: string | null
          quantidade_volumes: number | null
          serie: string | null
          status_aprovacao: Database["public"]["Enums"]["entrada_status"] | null
          tipo_ambiente: string | null
          tipo_ambiente_protocolo: string | null
          tipo_emissao: string | null
          tipo_impressao: string | null
          tipo_nf: string | null
          tipo_pagamento: string | null
          transportadora_cnpj: string | null
          transportadora_endereco: string | null
          transportadora_municipio: string | null
          transportadora_nome: string | null
          transportadora_uf: string | null
          updated_at: string
          user_id: string
          valor_bc_icms: number | null
          valor_bc_st: number | null
          valor_cofins: number | null
          valor_desconto: number | null
          valor_desconto_fatura: number | null
          valor_duplicata: number | null
          valor_fcp: number | null
          valor_fcp_st: number | null
          valor_fcp_st_ret: number | null
          valor_frete: number | null
          valor_icms: number | null
          valor_icms_desonerado: number | null
          valor_ii: number | null
          valor_ipi: number | null
          valor_ipi_devolvido: number | null
          valor_liquido_fatura: number | null
          valor_original_fatura: number | null
          valor_outros: number | null
          valor_pagamento: number | null
          valor_pis: number | null
          valor_produtos: number | null
          valor_seguro: number | null
          valor_st: number | null
          valor_total: number | null
          valor_total_tributos: number | null
          veiculo_placa: string | null
          veiculo_uf: string | null
          versao_aplicativo: string | null
          versao_nfe: string | null
          versao_processo: string | null
          xml_content: string | null
        }
        Insert: {
          aprovado_por?: string | null
          chave_nfe?: string | null
          cmun_fg?: string | null
          cnf?: string | null
          codigo_status?: string | null
          created_at?: string
          cuf?: string | null
          data_aprovacao?: string | null
          data_emissao?: string | null
          data_entrada: string
          data_recebimento?: string | null
          data_vencimento_duplicata?: string | null
          deposito_id?: string | null
          descricao_pagamento?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_codigo_municipio?: string | null
          destinatario_codigo_pais?: string | null
          destinatario_complemento?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_ie?: string | null
          destinatario_ind_ie?: string | null
          destinatario_logradouro?: string | null
          destinatario_municipio?: string | null
          destinatario_nome?: string | null
          destinatario_numero?: string | null
          destinatario_pais?: string | null
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          dh_emissao?: string | null
          dh_saida_entrada?: string | null
          digest_value?: string | null
          digito_verificador?: string | null
          divergencias?: Json | null
          emitente_bairro?: string | null
          emitente_cep?: string | null
          emitente_cnpj?: string | null
          emitente_codigo_municipio?: string | null
          emitente_codigo_pais?: string | null
          emitente_complemento?: string | null
          emitente_crt?: string | null
          emitente_endereco?: string | null
          emitente_ie?: string | null
          emitente_logradouro?: string | null
          emitente_municipio?: string | null
          emitente_nome?: string | null
          emitente_nome_fantasia?: string | null
          emitente_numero?: string | null
          emitente_telefone?: string | null
          emitente_uf?: string | null
          entrega_bairro?: string | null
          entrega_cep?: string | null
          entrega_cnpj?: string | null
          entrega_logradouro?: string | null
          entrega_municipio?: string | null
          entrega_nome?: string | null
          entrega_numero?: string | null
          entrega_telefone?: string | null
          entrega_uf?: string | null
          finalidade_nfe?: string | null
          fornecedor_id?: string | null
          id?: string
          id_dest?: string | null
          ind_final?: string | null
          ind_intermediador?: string | null
          ind_pres?: string | null
          indicador_pagamento?: string | null
          informacoes_complementares?: string | null
          modalidade_frete?: string | null
          modelo?: string | null
          motivo_status?: string | null
          natureza_operacao?: string | null
          numero_duplicata?: string | null
          numero_fatura?: string | null
          numero_nfe?: string | null
          numero_pedido_compra?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          observacoes_franqueado?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          processo_emissao?: string | null
          quantidade_volumes?: number | null
          serie?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["entrada_status"]
            | null
          tipo_ambiente?: string | null
          tipo_ambiente_protocolo?: string | null
          tipo_emissao?: string | null
          tipo_impressao?: string | null
          tipo_nf?: string | null
          tipo_pagamento?: string | null
          transportadora_cnpj?: string | null
          transportadora_endereco?: string | null
          transportadora_municipio?: string | null
          transportadora_nome?: string | null
          transportadora_uf?: string | null
          updated_at?: string
          user_id: string
          valor_bc_icms?: number | null
          valor_bc_st?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_desconto_fatura?: number | null
          valor_duplicata?: number | null
          valor_fcp?: number | null
          valor_fcp_st?: number | null
          valor_fcp_st_ret?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_icms_desonerado?: number | null
          valor_ii?: number | null
          valor_ipi?: number | null
          valor_ipi_devolvido?: number | null
          valor_liquido_fatura?: number | null
          valor_original_fatura?: number | null
          valor_outros?: number | null
          valor_pagamento?: number | null
          valor_pis?: number | null
          valor_produtos?: number | null
          valor_seguro?: number | null
          valor_st?: number | null
          valor_total?: number | null
          valor_total_tributos?: number | null
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          versao_aplicativo?: string | null
          versao_nfe?: string | null
          versao_processo?: string | null
          xml_content?: string | null
        }
        Update: {
          aprovado_por?: string | null
          chave_nfe?: string | null
          cmun_fg?: string | null
          cnf?: string | null
          codigo_status?: string | null
          created_at?: string
          cuf?: string | null
          data_aprovacao?: string | null
          data_emissao?: string | null
          data_entrada?: string
          data_recebimento?: string | null
          data_vencimento_duplicata?: string | null
          deposito_id?: string | null
          descricao_pagamento?: string | null
          destinatario_bairro?: string | null
          destinatario_cep?: string | null
          destinatario_codigo_municipio?: string | null
          destinatario_codigo_pais?: string | null
          destinatario_complemento?: string | null
          destinatario_cpf_cnpj?: string | null
          destinatario_email?: string | null
          destinatario_ie?: string | null
          destinatario_ind_ie?: string | null
          destinatario_logradouro?: string | null
          destinatario_municipio?: string | null
          destinatario_nome?: string | null
          destinatario_numero?: string | null
          destinatario_pais?: string | null
          destinatario_telefone?: string | null
          destinatario_uf?: string | null
          dh_emissao?: string | null
          dh_saida_entrada?: string | null
          digest_value?: string | null
          digito_verificador?: string | null
          divergencias?: Json | null
          emitente_bairro?: string | null
          emitente_cep?: string | null
          emitente_cnpj?: string | null
          emitente_codigo_municipio?: string | null
          emitente_codigo_pais?: string | null
          emitente_complemento?: string | null
          emitente_crt?: string | null
          emitente_endereco?: string | null
          emitente_ie?: string | null
          emitente_logradouro?: string | null
          emitente_municipio?: string | null
          emitente_nome?: string | null
          emitente_nome_fantasia?: string | null
          emitente_numero?: string | null
          emitente_telefone?: string | null
          emitente_uf?: string | null
          entrega_bairro?: string | null
          entrega_cep?: string | null
          entrega_cnpj?: string | null
          entrega_logradouro?: string | null
          entrega_municipio?: string | null
          entrega_nome?: string | null
          entrega_numero?: string | null
          entrega_telefone?: string | null
          entrega_uf?: string | null
          finalidade_nfe?: string | null
          fornecedor_id?: string | null
          id?: string
          id_dest?: string | null
          ind_final?: string | null
          ind_intermediador?: string | null
          ind_pres?: string | null
          indicador_pagamento?: string | null
          informacoes_complementares?: string | null
          modalidade_frete?: string | null
          modelo?: string | null
          motivo_status?: string | null
          natureza_operacao?: string | null
          numero_duplicata?: string | null
          numero_fatura?: string | null
          numero_nfe?: string | null
          numero_pedido_compra?: string | null
          numero_protocolo?: string | null
          observacoes?: string | null
          observacoes_franqueado?: string | null
          peso_bruto?: number | null
          peso_liquido?: number | null
          processo_emissao?: string | null
          quantidade_volumes?: number | null
          serie?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["entrada_status"]
            | null
          tipo_ambiente?: string | null
          tipo_ambiente_protocolo?: string | null
          tipo_emissao?: string | null
          tipo_impressao?: string | null
          tipo_nf?: string | null
          tipo_pagamento?: string | null
          transportadora_cnpj?: string | null
          transportadora_endereco?: string | null
          transportadora_municipio?: string | null
          transportadora_nome?: string | null
          transportadora_uf?: string | null
          updated_at?: string
          user_id?: string
          valor_bc_icms?: number | null
          valor_bc_st?: number | null
          valor_cofins?: number | null
          valor_desconto?: number | null
          valor_desconto_fatura?: number | null
          valor_duplicata?: number | null
          valor_fcp?: number | null
          valor_fcp_st?: number | null
          valor_fcp_st_ret?: number | null
          valor_frete?: number | null
          valor_icms?: number | null
          valor_icms_desonerado?: number | null
          valor_ii?: number | null
          valor_ipi?: number | null
          valor_ipi_devolvido?: number | null
          valor_liquido_fatura?: number | null
          valor_original_fatura?: number | null
          valor_outros?: number | null
          valor_pagamento?: number | null
          valor_pis?: number | null
          valor_produtos?: number | null
          valor_seguro?: number | null
          valor_st?: number | null
          valor_total?: number | null
          valor_total_tributos?: number | null
          veiculo_placa?: string | null
          veiculo_uf?: string | null
          versao_aplicativo?: string | null
          versao_nfe?: string | null
          versao_processo?: string | null
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
      estoque_reservas: {
        Row: {
          created_at: string
          data_validade: string | null
          deposito_id: string
          id: string
          lote: string | null
          produto_id: string
          quantidade_reservada: number
          saida_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_validade?: string | null
          deposito_id: string
          id?: string
          lote?: string | null
          produto_id: string
          quantidade_reservada: number
          saida_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_validade?: string | null
          deposito_id?: string
          id?: string
          lote?: string | null
          produto_id?: string
          quantidade_reservada?: number
          saida_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          latitude: number | null
          layout_armazem: string | null
          longitude: number | null
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
          latitude?: number | null
          layout_armazem?: string | null
          longitude?: number | null
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
          latitude?: number | null
          layout_armazem?: string | null
          longitude?: number | null
          master_franqueado_id?: string
          nome?: string
          numero?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      frete_faixas: {
        Row: {
          created_at: string
          distancia_max: number
          distancia_min: number
          id: string
          pedagio_por_ton: number
          prazo_dias: number
          tabela_frete_id: string
          valor_ate_300kg: number
          valor_por_kg_301_999: number
        }
        Insert: {
          created_at?: string
          distancia_max: number
          distancia_min: number
          id?: string
          pedagio_por_ton: number
          prazo_dias: number
          tabela_frete_id: string
          valor_ate_300kg: number
          valor_por_kg_301_999: number
        }
        Update: {
          created_at?: string
          distancia_max?: number
          distancia_min?: number
          id?: string
          pedagio_por_ton?: number
          prazo_dias?: number
          tabela_frete_id?: string
          valor_ate_300kg?: number
          valor_por_kg_301_999?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_frete_faixas_tabela"
            columns: ["tabela_frete_id"]
            isOneToOne: false
            referencedRelation: "tabelas_frete"
            referencedColumns: ["id"]
          },
        ]
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
      motoristas: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          categoria_cnh: string | null
          cnh: string
          cpf: string
          created_at: string
          data_vencimento_cnh: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          categoria_cnh?: string | null
          cnh: string
          cpf: string
          created_at?: string
          data_vencimento_cnh?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          categoria_cnh?: string | null
          cnh?: string
          cpf?: string
          created_at?: string
          data_vencimento_cnh?: string | null
          email?: string | null
          id?: string
          nome?: string
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
            foreignKeyName: "movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencia_fotos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          ocorrencia_id: string
          url_foto: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          ocorrencia_id: string
          url_foto: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          ocorrencia_id?: string
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencia_fotos_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias_transporte"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias_transporte: {
        Row: {
          acao_corretiva: string | null
          cliente_nome: string | null
          created_at: string
          data_resolucao: string | null
          descricao: string
          id: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          numero: string
          prioridade: string
          responsavel_id: string | null
          severidade: string
          status: string
          tempo_resolucao: unknown | null
          tipo: string
          titulo: string
          total_fotos: number
          tracking_id: string | null
          updated_at: string
          user_id: string
          viagem_id: string | null
        }
        Insert: {
          acao_corretiva?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao: string
          id?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          numero: string
          prioridade?: string
          responsavel_id?: string | null
          severidade?: string
          status?: string
          tempo_resolucao?: unknown | null
          tipo: string
          titulo: string
          total_fotos?: number
          tracking_id?: string | null
          updated_at?: string
          user_id: string
          viagem_id?: string | null
        }
        Update: {
          acao_corretiva?: string | null
          cliente_nome?: string | null
          created_at?: string
          data_resolucao?: string | null
          descricao?: string
          id?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          numero?: string
          prioridade?: string
          responsavel_id?: string | null
          severidade?: string
          status?: string
          tempo_resolucao?: unknown | null
          tipo?: string
          titulo?: string
          total_fotos?: number
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_transporte_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracking_entregas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_transporte_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
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
      pallet_positions: {
        Row: {
          alocado_em: string | null
          alocado_por: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          pallet_id: string
          posicao_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          alocado_em?: string | null
          alocado_por?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          pallet_id: string
          posicao_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          alocado_em?: string | null
          alocado_por?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          pallet_id?: string
          posicao_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallet_positions_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: true
            referencedRelation: "entrada_pallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_positions_posicao_id_fkey"
            columns: ["posicao_id"]
            isOneToOne: false
            referencedRelation: "storage_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
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
          expires_at?: string | null
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
          expires_at?: string | null
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
      permission_templates: {
        Row: {
          created_at: string
          default_route: string | null
          descricao: string | null
          id: string
          is_template: boolean
          nome: string
          permissions: Database["public"]["Enums"]["permission_code"][]
          target_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_route?: string | null
          descricao?: string | null
          id?: string
          is_template?: boolean
          nome: string
          permissions?: Database["public"]["Enums"]["permission_code"][]
          target_role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_route?: string | null
          descricao?: string | null
          id?: string
          is_template?: boolean
          nome?: string
          permissions?: Database["public"]["Enums"]["permission_code"][]
          target_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
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
          cest: string | null
          codigo: string | null
          composition: string | null
          containers_per_package: number | null
          created_at: string
          descricao: string | null
          description: string | null
          id: string
          informacoes_complementares: string | null
          manufacturer: string | null
          mapa_registration: string | null
          ncm: string | null
          nome: string
          package_capacity: number | null
          package_capacity_units: string | null
          package_string: string | null
          package_type: string | null
          physical_state: string | null
          short_description: string | null
          unidade_medida: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cest?: string | null
          codigo?: string | null
          composition?: string | null
          containers_per_package?: number | null
          created_at?: string
          descricao?: string | null
          description?: string | null
          id?: string
          informacoes_complementares?: string | null
          manufacturer?: string | null
          mapa_registration?: string | null
          ncm?: string | null
          nome: string
          package_capacity?: number | null
          package_capacity_units?: string | null
          package_string?: string | null
          package_type?: string | null
          physical_state?: string | null
          short_description?: string | null
          unidade_medida: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cest?: string | null
          codigo?: string | null
          composition?: string | null
          containers_per_package?: number | null
          created_at?: string
          descricao?: string | null
          description?: string | null
          id?: string
          informacoes_complementares?: string | null
          manufacturer?: string | null
          mapa_registration?: string | null
          ncm?: string | null
          nome?: string
          package_capacity?: number | null
          package_capacity_units?: string | null
          package_string?: string | null
          package_type?: string | null
          physical_state?: string | null
          short_description?: string | null
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
      reservas_horario: {
        Row: {
          created_at: string
          data_saida: string
          deposito_id: string
          horario: string
          id: string
          saida_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_saida: string
          deposito_id: string
          horario: string
          id?: string
          saida_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_saida?: string
          deposito_id?: string
          horario?: string
          id?: string
          saida_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_horario_saida_id_fkey"
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
          cpf_motorista: string | null
          created_at: string
          criado_por_franqueado: boolean | null
          data_aprovacao_produtor: string | null
          data_fim_janela: string | null
          data_inicio_janela: string | null
          data_saida: string
          deposito_id: string
          fazenda_id: string | null
          frete_destino: string | null
          frete_distancia: number | null
          frete_origem: string | null
          id: string
          janela_entrega_dias: number | null
          janela_horario: string | null
          mopp_motorista: string | null
          nome_motorista: string | null
          observacoes: string | null
          observacoes_aprovacao: string | null
          peso_total: number | null
          placa_veiculo: string | null
          produtor_destinatario_id: string | null
          status: Database["public"]["Enums"]["saida_status"] | null
          status_aprovacao_produtor: string | null
          telefone_motorista: string | null
          tipo_saida: string
          updated_at: string
          user_id: string
          valor_frete_calculado: number | null
          valor_total: number | null
          viagem_id: string | null
        }
        Insert: {
          cpf_motorista?: string | null
          created_at?: string
          criado_por_franqueado?: boolean | null
          data_aprovacao_produtor?: string | null
          data_fim_janela?: string | null
          data_inicio_janela?: string | null
          data_saida: string
          deposito_id: string
          fazenda_id?: string | null
          frete_destino?: string | null
          frete_distancia?: number | null
          frete_origem?: string | null
          id?: string
          janela_entrega_dias?: number | null
          janela_horario?: string | null
          mopp_motorista?: string | null
          nome_motorista?: string | null
          observacoes?: string | null
          observacoes_aprovacao?: string | null
          peso_total?: number | null
          placa_veiculo?: string | null
          produtor_destinatario_id?: string | null
          status?: Database["public"]["Enums"]["saida_status"] | null
          status_aprovacao_produtor?: string | null
          telefone_motorista?: string | null
          tipo_saida: string
          updated_at?: string
          user_id: string
          valor_frete_calculado?: number | null
          valor_total?: number | null
          viagem_id?: string | null
        }
        Update: {
          cpf_motorista?: string | null
          created_at?: string
          criado_por_franqueado?: boolean | null
          data_aprovacao_produtor?: string | null
          data_fim_janela?: string | null
          data_inicio_janela?: string | null
          data_saida?: string
          deposito_id?: string
          fazenda_id?: string | null
          frete_destino?: string | null
          frete_distancia?: number | null
          frete_origem?: string | null
          id?: string
          janela_entrega_dias?: number | null
          janela_horario?: string | null
          mopp_motorista?: string | null
          nome_motorista?: string | null
          observacoes?: string | null
          observacoes_aprovacao?: string | null
          peso_total?: number | null
          placa_veiculo?: string | null
          produtor_destinatario_id?: string | null
          status?: Database["public"]["Enums"]["saida_status"] | null
          status_aprovacao_produtor?: string | null
          telefone_motorista?: string | null
          tipo_saida?: string
          updated_at?: string
          user_id?: string
          valor_frete_calculado?: number | null
          valor_total?: number | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saidas_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "franquias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saidas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_positions: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string
          deposito_id: string
          descricao: string | null
          id: string
          ocupado: boolean | null
          reservado_ate: string | null
          reservado_por_wave_id: string | null
          reservado_temporariamente: boolean | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string
          deposito_id: string
          descricao?: string | null
          id?: string
          ocupado?: boolean | null
          reservado_ate?: string | null
          reservado_por_wave_id?: string | null
          reservado_temporariamente?: boolean | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string
          deposito_id?: string
          descricao?: string | null
          id?: string
          ocupado?: boolean | null
          reservado_ate?: string | null
          reservado_por_wave_id?: string | null
          reservado_temporariamente?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      tabela_frete_regras: {
        Row: {
          created_at: string
          descricao: string | null
          faixa_fim: number | null
          faixa_inicio: number
          id: string
          tabela_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          faixa_fim?: number | null
          faixa_inicio?: number
          id?: string
          tabela_id: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          faixa_fim?: number | null
          faixa_inicio?: number
          id?: string
          tabela_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "tabela_frete_regras_tabela_id_fkey"
            columns: ["tabela_id"]
            isOneToOne: false
            referencedRelation: "tabelas_frete"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_frete: {
        Row: {
          ativo: boolean
          created_at: string
          data_vencimento: string | null
          data_vigencia: string
          franqueado_id: string | null
          id: string
          nome: string
          origem: string | null
          tipo: string
          unidade: string
          updated_at: string
          user_id: string
          valor_base: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_vencimento?: string | null
          data_vigencia: string
          franqueado_id?: string | null
          id?: string
          nome: string
          origem?: string | null
          tipo: string
          unidade?: string
          updated_at?: string
          user_id: string
          valor_base?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_vencimento?: string | null
          data_vigencia?: string
          franqueado_id?: string | null
          id?: string
          nome?: string
          origem?: string | null
          tipo?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_base?: number
        }
        Relationships: []
      }
      tracking_entregas: {
        Row: {
          cliente_nome: string
          codigo_rastreamento: string
          created_at: string
          data_entrega: string | null
          data_partida: string | null
          distancia_percorrida: number | null
          distancia_total: number | null
          id: string
          localizacao_atual: string | null
          observacoes: string | null
          previsao_chegada: string | null
          produto_descricao: string | null
          status: string
          updated_at: string
          user_id: string
          viagem_id: string | null
        }
        Insert: {
          cliente_nome: string
          codigo_rastreamento: string
          created_at?: string
          data_entrega?: string | null
          data_partida?: string | null
          distancia_percorrida?: number | null
          distancia_total?: number | null
          id?: string
          localizacao_atual?: string | null
          observacoes?: string | null
          previsao_chegada?: string | null
          produto_descricao?: string | null
          status?: string
          updated_at?: string
          user_id: string
          viagem_id?: string | null
        }
        Update: {
          cliente_nome?: string
          codigo_rastreamento?: string
          created_at?: string
          data_entrega?: string | null
          data_partida?: string | null
          distancia_percorrida?: number | null
          distancia_total?: number | null
          id?: string
          localizacao_atual?: string | null
          observacoes?: string | null
          previsao_chegada?: string | null
          produto_descricao?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_entregas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_eventos: {
        Row: {
          created_at: string
          descricao: string
          hora: string
          id: string
          latitude: number | null
          local: string
          longitude: number | null
          tracking_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          hora: string
          id?: string
          latitude?: number | null
          local: string
          longitude?: number | null
          tracking_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          hora?: string
          id?: string
          latitude?: number | null
          local?: string
          longitude?: number | null
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_eventos_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracking_entregas"
            referencedColumns: ["id"]
          },
        ]
      }
      transportadoras: {
        Row: {
          ativo: boolean
          cnpj: string
          contato: string | null
          created_at: string
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          regiao_atendimento: string | null
          updated_at: string
          user_id: string
          valor_km: number | null
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean
          cnpj: string
          contato?: string | null
          created_at?: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          regiao_atendimento?: string | null
          updated_at?: string
          user_id: string
          valor_km?: number | null
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean
          cnpj?: string
          contato?: string | null
          created_at?: string
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          regiao_atendimento?: string | null
          updated_at?: string
          user_id?: string
          valor_km?: number | null
          valor_minimo?: number | null
        }
        Relationships: []
      }
      tutorial_entrada_itens: {
        Row: {
          codigo_ean: string | null
          codigo_produto: string | null
          created_at: string
          data_validade: string | null
          descricao_produto: string | null
          id: string
          lote: string | null
          nome_produto: string
          quantidade: number
          tutorial_entrada_id: string
          unidade_comercial: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          codigo_ean?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_validade?: string | null
          descricao_produto?: string | null
          id?: string
          lote?: string | null
          nome_produto: string
          quantidade: number
          tutorial_entrada_id: string
          unidade_comercial?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          codigo_ean?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_validade?: string | null
          descricao_produto?: string | null
          id?: string
          lote?: string | null
          nome_produto?: string
          quantidade?: number
          tutorial_entrada_id?: string
          unidade_comercial?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_entrada_itens_tutorial_entrada_id_fkey"
            columns: ["tutorial_entrada_id"]
            isOneToOne: false
            referencedRelation: "tutorial_entradas"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_entradas: {
        Row: {
          chave_nfe: string | null
          created_at: string
          data_emissao: string | null
          data_entrada: string
          destinatario_cpf_cnpj: string | null
          destinatario_nome: string | null
          emitente_cnpj: string | null
          emitente_nome: string | null
          id: string
          natureza_operacao: string | null
          numero_nfe: string
          observacoes: string | null
          serie: string | null
          valor_produtos: number | null
          valor_total: number | null
        }
        Insert: {
          chave_nfe?: string | null
          created_at?: string
          data_emissao?: string | null
          data_entrada: string
          destinatario_cpf_cnpj?: string | null
          destinatario_nome?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          id?: string
          natureza_operacao?: string | null
          numero_nfe: string
          observacoes?: string | null
          serie?: string | null
          valor_produtos?: number | null
          valor_total?: number | null
        }
        Update: {
          chave_nfe?: string | null
          created_at?: string
          data_emissao?: string | null
          data_entrada?: string
          destinatario_cpf_cnpj?: string | null
          destinatario_nome?: string | null
          emitente_cnpj?: string | null
          emitente_nome?: string | null
          id?: string
          natureza_operacao?: string | null
          numero_nfe?: string
          observacoes?: string | null
          serie?: string | null
          valor_produtos?: number | null
          valor_total?: number | null
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
      user_notification_views: {
        Row: {
          created_at: string
          id: string
          last_viewed_at: string
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_viewed_at?: string
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_viewed_at?: string
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permission_templates: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_employee_profiles_profile_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "permission_templates"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number | null
          ativo: boolean
          capacidade_peso: number | null
          capacidade_volume: number | null
          created_at: string
          id: string
          marca: string | null
          modelo: string | null
          placa: string
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano?: number | null
          ativo?: boolean
          capacidade_peso?: number | null
          capacidade_volume?: number | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          placa: string
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number | null
          ativo?: boolean
          capacidade_peso?: number | null
          capacidade_volume?: number | null
          created_at?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          placa?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      viagens: {
        Row: {
          combustivel_fim: number | null
          combustivel_inicio: number | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          deposito_id: string
          distancia_percorrida: number
          distancia_total: number
          hodometro_fim: number | null
          hodometro_inicio: number | null
          id: string
          motorista_id: string | null
          numero: string
          observacoes: string | null
          peso_total: number | null
          remessas_entregues: number
          status: string
          total_remessas: number
          updated_at: string
          user_id: string
          veiculo_id: string | null
        }
        Insert: {
          combustivel_fim?: number | null
          combustivel_inicio?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deposito_id: string
          distancia_percorrida?: number
          distancia_total?: number
          hodometro_fim?: number | null
          hodometro_inicio?: number | null
          id?: string
          motorista_id?: string | null
          numero: string
          observacoes?: string | null
          peso_total?: number | null
          remessas_entregues?: number
          status?: string
          total_remessas?: number
          updated_at?: string
          user_id: string
          veiculo_id?: string | null
        }
        Update: {
          combustivel_fim?: number | null
          combustivel_inicio?: number | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          deposito_id?: string
          distancia_percorrida?: number
          distancia_total?: number
          hodometro_fim?: number | null
          hodometro_inicio?: number | null
          id?: string
          motorista_id?: string | null
          numero?: string
          observacoes?: string | null
          peso_total?: number | null
          remessas_entregues?: number
          status?: string
          total_remessas?: number
          updated_at?: string
          user_id?: string
          veiculo_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_pallet_to_position: {
        Args: {
          p_observacoes?: string
          p_pallet_id: string
          p_posicao_id: string
        }
        Returns: boolean
      }
      alocar_produtos_orfaos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      auto_allocate_positions: {
        Args: { p_wave_id: string }
        Returns: boolean
      }
      calculate_viagem_peso_total: {
        Args: { p_viagem_id: string }
        Returns: number
      }
      can_create_role: {
        Args: {
          _creator_user_id: string
          _target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      can_franqueado_import_for_delivery: {
        Args: { _delivery_cnpj: string; _franqueado_id: string }
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
      clean_completed_wave_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clean_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      clean_orphaned_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
        Args: { _email: string } | { _email: string; _user_id: string }
        Returns: Json
      }
      complete_pallet_allocation_and_create_stock: {
        Args: {
          p_barcode_pallet: string
          p_barcode_posicao: string
          p_divergencias?: Json
          p_posicao_id: string
          p_produtos_conferidos: Json
          p_wave_pallet_id: string
        }
        Returns: boolean
      }
      create_stock_from_pallet: {
        Args: { p_pallet_id: string }
        Returns: boolean
      }
      define_wave_positions: {
        Args: { p_wave_id: string }
        Returns: Json
      }
      diagnose_user_signup: {
        Args: { _email: string }
        Returns: string
      }
      find_or_create_produto: {
        Args: {
          p_codigo_ean?: string
          p_codigo_produto?: string
          p_descricao_produto?: string
          p_nome_produto: string
          p_unidade_comercial?: string
          p_user_id: string
        }
        Returns: string
      }
      find_produtor_for_import: {
        Args: { _cpf_cnpj: string; _requesting_user_id: string }
        Returns: {
          cpf_cnpj: string
          email: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      fix_incorrectly_occupied_positions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      fix_position_occupancy_status: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      franqueado_can_view_producer: {
        Args: { _franqueado_id: string; _produtor_id: string }
        Returns: boolean
      }
      generate_inventory_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_pallet_barcode: {
        Args:
          | Record<PropertyKey, never>
          | { p_entrada_id: string; p_numero_pallet: number }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_estoque_from_movimentacoes: {
        Args: Record<PropertyKey, never>
        Returns: {
          deposito_id: string
          lote: string
          produto_id: string
          produtos: Json
          quantidade_atual: number
          user_id: string
          valor_total: number
          valor_unitario: number
        }[]
      }
      get_invite_email: {
        Args: { _invite_token: string }
        Returns: string
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
      is_subaccount: {
        Args: { _user_id: string }
        Returns: boolean
      }
      link_motorista_to_auth_user: {
        Args: { p_auth_user_id: string; p_cpf: string }
        Returns: boolean
      }
      migrate_existing_divergencias: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_entrada_itens_without_produto: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_orphaned_invites: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_saida_items: {
        Args: { p_saida_id: string }
        Returns: boolean
      }
      produto_tem_posicao_fisica: {
        Args: {
          p_deposito_id: string
          p_produto_id: string
          p_quantidade?: number
        }
        Returns: boolean
      }
      refresh_estoque_simple: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_wave_positions: {
        Args: { p_wave_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "franqueado" | "produtor" | "motorista"
      entrada_status:
        | "aguardando_transporte"
        | "em_transferencia"
        | "aguardando_conferencia"
        | "conferencia_completa"
        | "confirmado"
        | "rejeitado"
        | "planejamento"
      inventory_status: "iniciado" | "em_andamento" | "concluido" | "cancelado"
      permission_code:
        | "estoque.view"
        | "estoque.manage"
        | "entradas.manage"
        | "saidas.manage"
        | "dashboard.view"
        | "entradas.view"
        | "saidas.view"
        | "recebimento.view"
        | "alocacao.view"
        | "separacao.view"
        | "expedicao.view"
        | "inventario.view"
        | "relatorios.view"
        | "rastreio.view"
        | "perfis-funcionarios.view"
        | "catalogo.view"
        | "alocacao-pallets.view"
        | "gerenciar-posicoes.view"
        | "veiculos.view"
        | "veiculos.manage"
        | "motoristas.view"
        | "motoristas.manage"
        | "remessas.view"
        | "viagens.view"
        | "agenda.view"
        | "tracking.view"
        | "proof-of-delivery.view"
        | "proof-of-delivery.manage"
        | "comprovantes.view"
        | "ocorrencias.view"
        | "tabela-frete.view"
        | "tabelas-frete.view"
        | "motorista.deliveries.view"
        | "produtores.view"
        | "fazendas.view"
        | "subcontas.view"
        | "perfil.view"
        | "instrucoes.view"
        | "suporte.view"
        | "configuracoes.view"
        | "controle-acesso.view"
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
      app_role: ["admin", "franqueado", "produtor", "motorista"],
      entrada_status: [
        "aguardando_transporte",
        "em_transferencia",
        "aguardando_conferencia",
        "conferencia_completa",
        "confirmado",
        "rejeitado",
        "planejamento",
      ],
      inventory_status: ["iniciado", "em_andamento", "concluido", "cancelado"],
      permission_code: [
        "estoque.view",
        "estoque.manage",
        "entradas.manage",
        "saidas.manage",
        "dashboard.view",
        "entradas.view",
        "saidas.view",
        "recebimento.view",
        "alocacao.view",
        "separacao.view",
        "expedicao.view",
        "inventario.view",
        "relatorios.view",
        "rastreio.view",
        "perfis-funcionarios.view",
        "catalogo.view",
        "alocacao-pallets.view",
        "gerenciar-posicoes.view",
        "veiculos.view",
        "veiculos.manage",
        "motoristas.view",
        "motoristas.manage",
        "remessas.view",
        "viagens.view",
        "agenda.view",
        "tracking.view",
        "proof-of-delivery.view",
        "proof-of-delivery.manage",
        "comprovantes.view",
        "ocorrencias.view",
        "tabela-frete.view",
        "tabelas-frete.view",
        "motorista.deliveries.view",
        "produtores.view",
        "fazendas.view",
        "subcontas.view",
        "perfil.view",
        "instrucoes.view",
        "suporte.view",
        "configuracoes.view",
        "controle-acesso.view",
      ],
      saida_status: ["separacao_pendente", "separado", "expedido", "entregue"],
    },
  },
} as const
