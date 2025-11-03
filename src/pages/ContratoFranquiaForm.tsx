import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useFranquias } from "@/hooks/useFranquias"
import { useCreateContratoFranquia, useUpdateContratoFranquia } from "@/hooks/useContratoFranquiaMutations"
import { useContratoFranquiaById } from "@/hooks/useContratosFranquia"
import { cn } from "@/lib/utils"

const contratoSchema = z.object({
  numero_contrato: z.string().min(1, "Número do contrato é obrigatório"),
  franquia_id: z.string().min(1, "Selecione uma franquia"),
  tipo_royalty: z.enum(['percentual_faturamento', 'valor_fixo_mensal', 'margem_por_servico']),
  percentual_faturamento: z.number().min(0).max(100).optional(),
  valor_fixo_mensal: z.number().min(0).optional(),
  data_inicio: z.date({ required_error: "Data de início é obrigatória" }),
  data_fim: z.date().optional(),
  dia_vencimento: z.number().min(1).max(31),
  status: z.enum(['ativo', 'suspenso', 'cancelado']),
  observacoes: z.string().optional(),
})

type ContratoFormData = z.infer<typeof contratoSchema>

export default function ContratoFranquiaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const { data: franquias, isLoading: loadingFranquias } = useFranquias()
  const { data: contrato, isLoading: loadingContrato } = useContratoFranquiaById(id || "")
  const createMutation = useCreateContratoFranquia()
  const updateMutation = useUpdateContratoFranquia()

  const form = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      numero_contrato: "",
      franquia_id: "",
      tipo_royalty: "percentual_faturamento",
      percentual_faturamento: 0,
      valor_fixo_mensal: 0,
      dia_vencimento: 10,
      status: "ativo",
      observacoes: "",
    },
  })

  const tipoRoyalty = form.watch("tipo_royalty")

  const onSubmit = (data: ContratoFormData) => {
    const payload = {
      numero_contrato: data.numero_contrato,
      franquia_id: data.franquia_id,
      tipo_royalty: data.tipo_royalty,
      percentual_faturamento: data.tipo_royalty === 'percentual_faturamento' ? data.percentual_faturamento : null,
      valor_fixo_mensal: data.tipo_royalty === 'valor_fixo_mensal' ? data.valor_fixo_mensal : null,
      margens_servico: data.tipo_royalty === 'margem_por_servico' ? {} : null,
      data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
      data_fim: data.data_fim ? format(data.data_fim, 'yyyy-MM-dd') : null,
      dia_vencimento: data.dia_vencimento,
      status: data.status,
      observacoes: data.observacoes,
    }

    if (isEditing && id) {
      updateMutation.mutate({ id, data: payload })
    } else {
      createMutation.mutate(payload as any)
    }
  }

  if (loadingFranquias || (isEditing && loadingContrato)) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Editar Contrato" : "Novo Contrato com Franquia"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="numero_contrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Contrato *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CONT-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="franquia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Franquia *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma franquia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {franquias?.map((franquia) => (
                            <SelectItem key={franquia.id} value={franquia.id}>
                              {franquia.nome} - {Array.isArray(franquia.profiles) 
                                ? franquia.profiles[0]?.nome 
                                : (franquia.profiles as any)?.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_royalty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Royalty *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentual_faturamento">% do Faturamento</SelectItem>
                          <SelectItem value="valor_fixo_mensal">Valor Fixo Mensal</SelectItem>
                          <SelectItem value="margem_por_servico">Margem por Serviço</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {tipoRoyalty === 'percentual_faturamento' && (
                  <FormField
                    control={form.control}
                    name="percentual_faturamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentual (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {tipoRoyalty === 'valor_fixo_mensal' && (
                  <FormField
                    control={form.control}
                    name="valor_fixo_mensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Fixo Mensal (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Fim (Opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Indeterminado</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dia_vencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia de Vencimento *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre o contrato..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/contratos-franquias")}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditing ? "Atualizar" : "Criar"} Contrato
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
