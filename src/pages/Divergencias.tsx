import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablePageLayout } from "@/components/ui/table-page-layout";
import { ResponsiveTable, ResponsiveTableBody, ResponsiveTableCell, ResponsiveTableHead, ResponsiveTableHeader, ResponsiveTableRow } from "@/components/ui/responsive-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequirePageAccess } from "@/components/Auth/RequirePageAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateNotificationView } from "@/hooks/useNotificationViews";
import { useDepositoFilter } from "@/hooks/useDepositoFilter";

interface Divergencia {
  id: string;
  tipo_divergencia: string;
  quantidade_esperada: number;
  quantidade_encontrada: number;
  diferenca: number;
  valor_impacto: number;
  status: string;
  prioridade: string;
  lote: string;
  justificativa: string;
  observacoes: string;
  created_at: string;
  tipo_origem: string;
  entrada_id: string;
  produto_id: string;
  user_id: string;
  produtos?: {
    id: string;
    nome: string;
    codigo: string;
  } | null;
  entradas?: {
    id: string;
    numero_nfe: string;
    emitente_nome: string;
  } | null;
}

const statusColors = {
  pendente: "default",
  resolvida: "secondary",
  cancelada: "destructive"
} as const;

const prioridadeColors = {
  baixa: "secondary",
  media: "default", 
  alta: "destructive"
} as const;

const Divergencias = () => {
  const updateNotificationView = useUpdateNotificationView();
  const { depositoId, shouldFilter } = useDepositoFilter();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Mark as viewed when component mounts
  useEffect(() => {
    updateNotificationView.mutate("divergencias");
  }, []);

  const { data: divergencias = [], isLoading } = useQuery({
    queryKey: ["divergencias", filtroStatus, filtroPrioridade, filtroTipo, searchTerm, depositoId],
    queryFn: async (): Promise<Divergencia[]> => {
      let query = supabase
        .from("divergencias")
        .select(`
          id,
          tipo_divergencia,
          quantidade_esperada,
          quantidade_encontrada,
          diferenca,
          valor_impacto,
          status,
          prioridade,
          lote,
          justificativa,
          observacoes,
          created_at,
          tipo_origem,
          entrada_id,
          produto_id,
          user_id,
          deposito_id
        `)
        .order("created_at", { ascending: false });

      if (shouldFilter && depositoId) {
        query = query.eq("deposito_id", depositoId);
      }

      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }

      if (filtroPrioridade !== "todos") {
        query = query.eq("prioridade", filtroPrioridade);
      }

      if (filtroTipo !== "todos") {
        query = query.eq("tipo_divergencia", filtroTipo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar dados relacionados separadamente se existirem dados
      if (data && data.length > 0) {
        const produtoIds = [...new Set(data.map(d => d.produto_id).filter(Boolean))];
        const entradaIds = [...new Set(data.map(d => d.entrada_id).filter(Boolean))];

        // Buscar produtos e entradas se existirem IDs
        const produtosResponse = produtoIds.length > 0 
          ? await supabase.from("produtos").select("id, nome, codigo").in("id", produtoIds)
          : { data: [] };
          
        const entradasResponse = entradaIds.length > 0 
          ? await supabase.from("entradas").select("id, numero_nfe, emitente_nome").in("id", entradaIds)
          : { data: [] };

        // Criar mapas para busca rápida
        const produtosMap = new Map(
          (produtosResponse.data || []).map(p => [p.id, p])
        );
        const entradasMap = new Map(
          (entradasResponse.data || []).map(e => [e.id, e])
        );

        // Mapear dados com informações relacionadas
        return data.map(divergencia => ({
          ...divergencia,
          produtos: divergencia.produto_id ? produtosMap.get(divergencia.produto_id) || null : null,
          entradas: divergencia.entrada_id ? entradasMap.get(divergencia.entrada_id) || null : null
        }));
      }

      return data || [];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const FilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Input
        placeholder="Buscar por produto ou lote..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="resolvida">Resolvida</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
        <SelectTrigger>
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as Prioridades</SelectItem>
          <SelectItem value="baixa">Baixa</SelectItem>
          <SelectItem value="media">Média</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          <SelectItem value="quantidade">Quantidade</SelectItem>
          <SelectItem value="avaria">Avaria</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const TableContent = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (!divergencias.length) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Nenhuma divergência encontrada
        </div>
      );
    }

    return (
      <ResponsiveTable>
        <ResponsiveTableHeader>
          <ResponsiveTableRow>
            <ResponsiveTableHead>Data</ResponsiveTableHead>
            <ResponsiveTableHead>Tipo</ResponsiveTableHead>
            <ResponsiveTableHead>Produto</ResponsiveTableHead>
            <ResponsiveTableHead>Lote</ResponsiveTableHead>
            <ResponsiveTableHead>NFe</ResponsiveTableHead>
            <ResponsiveTableHead>Qtd. Esperada</ResponsiveTableHead>
            <ResponsiveTableHead>Qtd. Encontrada</ResponsiveTableHead>
            <ResponsiveTableHead>Diferença</ResponsiveTableHead>
            <ResponsiveTableHead>Impacto</ResponsiveTableHead>
            <ResponsiveTableHead>Status</ResponsiveTableHead>
            <ResponsiveTableHead>Prioridade</ResponsiveTableHead>
          </ResponsiveTableRow>
        </ResponsiveTableHeader>
        <ResponsiveTableBody>
          {divergencias.map((divergencia) => (
            <ResponsiveTableRow key={divergencia.id}>
              <ResponsiveTableCell>
                {format(new Date(divergencia.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </ResponsiveTableCell>
              <ResponsiveTableCell>
                <Badge variant="outline" className="capitalize">
                  {divergencia.tipo_divergencia}
                </Badge>
              </ResponsiveTableCell>
              <ResponsiveTableCell>
                <div>
                  <div className="font-medium">{divergencia.produtos?.nome || "-"}</div>
                  <div className="text-sm text-muted-foreground">{divergencia.produtos?.codigo || "-"}</div>
                </div>
              </ResponsiveTableCell>
              <ResponsiveTableCell>{divergencia.lote || "-"}</ResponsiveTableCell>
              <ResponsiveTableCell>
                <div>
                  <div className="font-medium">{divergencia.entradas?.numero_nfe || "-"}</div>
                  <div className="text-sm text-muted-foreground">{divergencia.entradas?.emitente_nome || "-"}</div>
                </div>
              </ResponsiveTableCell>
              <ResponsiveTableCell>{divergencia.quantidade_esperada}</ResponsiveTableCell>
              <ResponsiveTableCell>{divergencia.quantidade_encontrada}</ResponsiveTableCell>
              <ResponsiveTableCell>
                <span className={divergencia.diferenca < 0 ? "text-destructive" : "text-primary"}>
                  {divergencia.diferenca > 0 ? "+" : ""}{divergencia.diferenca}
                </span>
              </ResponsiveTableCell>
              <ResponsiveTableCell>
                {divergencia.valor_impacto ? formatCurrency(divergencia.valor_impacto) : "-"}
              </ResponsiveTableCell>
              <ResponsiveTableCell>
                <Badge variant={statusColors[divergencia.status as keyof typeof statusColors]}>
                  {divergencia.status}
                </Badge>
              </ResponsiveTableCell>
              <ResponsiveTableCell>
                <Badge variant={prioridadeColors[divergencia.prioridade as keyof typeof prioridadeColors]}>
                  {divergencia.prioridade}
                </Badge>
              </ResponsiveTableCell>
            </ResponsiveTableRow>
          ))}
        </ResponsiveTableBody>
      </ResponsiveTable>
    );
  };

  return (
    <RequirePageAccess pageKey="divergencias">
      <TablePageLayout
        title="Divergências"
        description="Consulte e gerencie divergências encontradas no recebimento"
        filterSection={<FilterSection />}
        tableContent={<TableContent />}
      />
    </RequirePageAccess>
  );
};

export default Divergencias;