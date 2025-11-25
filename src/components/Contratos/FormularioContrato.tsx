import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { contratoSchema, servicoContratoSchema } from "@/lib/validations/contrato.schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Trash2, Save } from "lucide-react"
import { useContratoDetalhes } from "@/hooks/useContratoDetalhes"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"

type FormValues = z.infer<typeof contratoSchema>

interface FormularioContratoProps {
  contratoId?: string
  onSuccess?: () => void
}

export function FormularioContrato({ contratoId, onSuccess }: FormularioContratoProps) {
  const { user } = useAuth()
  const { isAdmin, isOperador } = useUserRole()
  const { data: contratoData } = useContratoDetalhes(contratoId)

  // Buscar franquias (apenas para admin)
  const { data: franquias } = useQuery({
    queryKey: ['franquias-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('franquias')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome')
      
      if (error) throw error
      return data
    },
    enabled: isAdmin
  })

  // Buscar produtores
  const { data: produtores } = useQuery({
    queryKey: ['produtores-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .eq('role', 'produtor')
        .order('nome')
      
      if (error) throw error
      return data
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      numero_contrato: "",
      franquia_id: "",
      produtor_id: "",
      data_inicio: "",
      data_fim: "",
      dia_vencimento: 10,
      tipo_cobranca: "mensal",
      observacoes: "",
      status: "ativo",
      tags: [],
      prioridade_padrao: 50,
      servicos: [],
      slas: [],
      janelas_entrega: [],
    },
  })

  // Load existing data when editing
  useEffect(() => {
    if (contratoData?.contrato && contratoId) {
      const { contrato, servicos, slas, janelas } = contratoData
      
      form.reset({
        numero_contrato: contrato.numero_contrato,
        franquia_id: contrato.franquia_id,
        produtor_id: contrato.produtor_id,
        data_inicio: contrato.data_inicio,
        data_fim: contrato.data_fim || "",
        dia_vencimento: contrato.dia_vencimento,
        tipo_cobranca: contrato.tipo_cobranca,
        observacoes: contrato.observacoes || "",
        status: contrato.status,
        tags: (contrato.tags as string[]) || [],
        prioridade_padrao: contrato.prioridade_padrao || 50,
        servicos: servicos.map(s => ({
          tipo_servico: s.tipo_servico,
          descricao: s.descricao || "",
          quantidade_incluida: s.quantidade_incluida || 0,
          quantidade_minima: s.quantidade_minima || 0,
          valor_unitario: s.valor_unitario,
          valor_excedente: s.valor_excedente || undefined,
        })),
        slas: slas.map(s => ({
          tipo_sla: s.tipo_sla,
          descricao: s.descricao || "",
          valor_esperado: s.valor_esperado,
          unidade: s.unidade,
          penalidade_percentual: s.penalidade_percentual || undefined,
        })),
        janelas_entrega: janelas.map(j => ({
          dia_semana: j.dia_semana,
          horario_inicio: j.hora_inicio,
          horario_fim: j.hora_fim,
          capacidade_maxima: j.capacidade_max_pallets || undefined,
          observacoes: j.observacoes || "",
        })),
      })
    }
  }, [contratoData, contratoId, form])

  const { fields: servicoFields, append: appendServico, remove: removeServico } = useFieldArray({
    control: form.control,
    name: "servicos",
  })

  const { fields: slaFields, append: appendSla, remove: removeSla } = useFieldArray({
    control: form.control,
    name: "slas",
  })

  const { fields: janelaFields, append: appendJanela, remove: removeJanela } = useFieldArray({
    control: form.control,
    name: "janelas_entrega",
  })

  const onSubmit = async (data: FormValues) => {
    try {
      let contratoIdToUse = contratoId

      if (contratoId) {
        // Update existing contract
        const { error: updateError } = await supabase
          .from('contratos_servico')
          .update({
            numero_contrato: data.numero_contrato,
            franquia_id: data.franquia_id,
            produtor_id: data.produtor_id,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim || null,
            dia_vencimento: data.dia_vencimento,
            tipo_cobranca: data.tipo_cobranca,
            observacoes: data.observacoes || null,
            status: data.status,
            tags: data.tags || [],
            prioridade_padrao: data.prioridade_padrao || 50,
          })
          .eq('id', contratoId)

        if (updateError) throw updateError
        
        // Delete existing servicos, slas, and janelas to recreate them
        await supabase.from('contrato_servicos_itens').delete().eq('contrato_id', contratoId)
        await supabase.from('contrato_sla').delete().eq('contrato_id', contratoId)
        await supabase.from('contrato_janelas_entrega').delete().eq('contrato_id', contratoId)
      } else {
        // Create new contract
        const { data: contrato, error: contratoError } = await supabase
          .from('contratos_servico')
          .insert([{
            numero_contrato: data.numero_contrato,
            franquia_id: data.franquia_id,
            produtor_id: data.produtor_id,
            data_inicio: data.data_inicio,
            data_fim: data.data_fim || null,
            dia_vencimento: data.dia_vencimento,
            tipo_cobranca: data.tipo_cobranca,
            observacoes: data.observacoes || null,
            status: data.status,
            tags: data.tags || [],
            prioridade_padrao: data.prioridade_padrao || 50,
          }])
          .select()
          .single()

        if (contratoError) {
          if (contratoError.code === '23505') {
            toast.error('Este número de contrato já existe. Por favor, use um número diferente.')
            return
          }
          throw contratoError
        }
        
        contratoIdToUse = contrato.id
      }

      // Insert Servicos if any
      if (data.servicos && data.servicos.length > 0) {
        const servicosData = data.servicos.map(servico => ({
          contrato_id: contratoIdToUse,
          tipo_servico: servico.tipo_servico,
          descricao: servico.descricao || null,
          quantidade_incluida: servico.quantidade_incluida || 0,
          quantidade_minima: servico.quantidade_minima || 0,
          valor_unitario: servico.valor_unitario,
          valor_excedente: servico.valor_excedente || null,
        }))

        const { error: servicosError } = await supabase
          .from('contrato_servicos_itens')
          .insert(servicosData)

        if (servicosError) throw servicosError
      }

      // Insert SLAs if any
      if (data.slas && data.slas.length > 0) {
        const slasData = data.slas.map(sla => ({
          contrato_id: contratoIdToUse,
          tipo_sla: sla.tipo_sla,
          descricao: sla.descricao || null,
          valor_esperado: sla.valor_esperado,
          unidade: sla.unidade,
          penalidade_percentual: sla.penalidade_percentual || null,
        }))

        const { error: slasError } = await supabase
          .from('contrato_sla')
          .insert(slasData)

        if (slasError) throw slasError
      }

      // Insert Janelas de Entrega if any
      if (data.janelas_entrega && data.janelas_entrega.length > 0) {
        const janelasData = data.janelas_entrega.map(janela => ({
          contrato_id: contratoIdToUse,
          dia_semana: janela.dia_semana,
          hora_inicio: janela.horario_inicio,
          hora_fim: janela.horario_fim,
          capacidade_max_pallets: janela.capacidade_maxima || null,
          observacoes: janela.observacoes || null,
        }))

        const { error: janelasError } = await supabase
          .from('contrato_janelas_entrega')
          .insert(janelasData)

        if (janelasError) throw janelasError
      }

      toast.success(contratoId ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!')
      if (!contratoId) form.reset()
      onSuccess?.()
    } catch (error: any) {
      toast.error(`Erro ao ${contratoId ? 'atualizar' : 'criar'} contrato: ` + error.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {contratoId ? 'Editar Contrato' : 'Novo Contrato'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Número do Contrato */}
          <FormField
            control={form.control}
            name="numero_contrato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do Contrato *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: CTR-2025-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Franquia */}
          <FormField
            control={form.control}
            name="franquia_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Franquia *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a franquia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {franquias?.map((franquia) => (
                      <SelectItem key={franquia.id} value={franquia.id}>
                        {franquia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Produtor */}
          <FormField
            control={form.control}
            name="produtor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produtor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produtor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {produtores?.map((produtor) => (
                      <SelectItem key={produtor.user_id} value={produtor.user_id}>
                        {produtor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Início */}
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Término */}
          <FormField
            control={form.control}
            name="data_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Deixe vazio para contrato indeterminado</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Cobrança */}
          <FormField
            control={form.control}
            name="tipo_cobranca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cobrança *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dia de Vencimento */}
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

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="expirado">Expirado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Observações */}
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags do Cliente (Priorização) */}
        <div className="space-y-3">
          <div>
            <FormLabel className="text-base font-semibold">Tags do Cliente (Priorização)</FormLabel>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione tags para priorização automática na separação
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['vip', 'premium', 'preferencial', 'padrao'] as const).map((tag) => (
              <Button
                key={tag}
                type="button"
                variant={form.watch('tags')?.includes(tag) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const currentTags = form.getValues('tags') || []
                  if (currentTags.includes(tag)) {
                    form.setValue('tags', currentTags.filter(t => t !== tag))
                  } else {
                    form.setValue('tags', [...currentTags, tag])
                  }
                }}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Serviços Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Serviços Contratados</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendServico({
                tipo_servico: "armazenagem_pallet_dia",
                descricao: "",
                quantidade_incluida: 0,
                quantidade_minima: 0,
                valor_unitario: 0,
                valor_excedente: 0,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {servicoFields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`servicos.${index}.tipo_servico`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Serviço *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="armazenagem_pallet_dia">Armazenagem Pallet/Dia</SelectItem>
                            <SelectItem value="entrada_item">Entrada Item</SelectItem>
                            <SelectItem value="saida_item">Saída Item</SelectItem>
                            <SelectItem value="taxa_fixa_mensal">Taxa Fixa Mensal</SelectItem>
                            <SelectItem value="movimentacao_interna">Movimentação Interna</SelectItem>
                            <SelectItem value="separacao_picking">Separação/Picking</SelectItem>
                            <SelectItem value="repaletizacao">Repaletização</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`servicos.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`servicos.${index}.valor_unitario`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Unitário *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`servicos.${index}.quantidade_incluida`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Incluída</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`servicos.${index}.quantidade_minima`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Mínima</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`servicos.${index}.valor_excedente`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Excedente</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => removeServico(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Serviço
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SLAs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">SLAs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSla({
                tipo_sla: "tempo_processamento_entrada",
                descricao: "",
                valor_esperado: 0,
                unidade: "horas",
                penalidade_percentual: 0,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar SLA
            </Button>
          </div>

          {slaFields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`slas.${index}.tipo_sla`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de SLA *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tempo_processamento_entrada">Tempo Processamento Entrada</SelectItem>
                            <SelectItem value="tempo_preparacao_saida">Tempo Preparação Saída</SelectItem>
                            <SelectItem value="prazo_entrega">Prazo Entrega</SelectItem>
                            <SelectItem value="taxa_avarias_max">Taxa Avarias Máx</SelectItem>
                            <SelectItem value="tempo_resposta_divergencia">Tempo Resposta Divergência</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`slas.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`slas.${index}.valor_esperado`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Meta *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`slas.${index}.unidade`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="horas">Horas</SelectItem>
                            <SelectItem value="dias">Dias</SelectItem>
                            <SelectItem value="percentual">Percentual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`slas.${index}.penalidade_percentual`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penalidade (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => removeSla(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover SLA
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Janelas de Entrega Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Janelas de Entrega</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendJanela({
                dia_semana: 1,
                horario_inicio: "08:00",
                horario_fim: "17:00",
                capacidade_maxima: 10,
                observacoes: "",
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Janela
            </Button>
          </div>

          {janelaFields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`janelas_entrega.${index}.dia_semana`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia da Semana *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Domingo</SelectItem>
                            <SelectItem value="1">Segunda-feira</SelectItem>
                            <SelectItem value="2">Terça-feira</SelectItem>
                            <SelectItem value="3">Quarta-feira</SelectItem>
                            <SelectItem value="4">Quinta-feira</SelectItem>
                            <SelectItem value="5">Sexta-feira</SelectItem>
                            <SelectItem value="6">Sábado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`janelas_entrega.${index}.horario_inicio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Início *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`janelas_entrega.${index}.horario_fim`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário de Fim *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`janelas_entrega.${index}.capacidade_maxima`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade Máxima (Pallets)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`janelas_entrega.${index}.observacoes`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => removeJanela(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Janela
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {contratoId ? "Salvar Alterações" : "Criar Contrato"}
        </Button>
      </form>
    </Form>
  )
}
