import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { slaSchema, janelaEntregaSchema } from "@/lib/validations/contrato.schemas"

const contratoSchema = z.object({
  franquia_id: z.string().min(1, "Selecione uma franquia"),
  produtor_id: z.string().min(1, "Selecione um produtor"),
  numero_contrato: z.string()
    .min(1, "Número do contrato é obrigatório")
    .max(50, "Número muito longo"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().optional(),
  tipo_cobranca: z.enum(['mensal', 'quinzenal', 'por_demanda']),
  dia_vencimento: z.coerce
    .number()
    .min(1, "Dia deve ser entre 1 e 31")
    .max(31, "Dia deve ser entre 1 e 31"),
  observacoes: z.string().max(500, "Observações muito longas").optional(),
  // Valores dos serviços
  valor_recebimento: z.coerce.number().min(0, "Valor deve ser não negativo").optional(),
  valor_armazenagem: z.coerce.number().min(0, "Valor deve ser não negativo").optional(),
  valor_expedicao_pallet: z.coerce.number().min(0, "Valor deve ser não negativo").optional(),
  valor_expedicao_peca: z.coerce.number().min(0, "Valor deve ser não negativo").optional(),
  // SLAs e Janelas de Entrega
  slas: z.array(slaSchema).optional(),
  janelas_entrega: z.array(janelaEntregaSchema).optional(),
}).refine(
  (data) => {
    if (data.data_fim) {
      return new Date(data.data_fim) > new Date(data.data_inicio)
    }
    return true
  },
  {
    message: "Data de término deve ser posterior à data de início",
    path: ["data_fim"],
  }
)

type ContratoFormValues = z.infer<typeof contratoSchema>

interface FormularioContratoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FormularioContrato({ open, onOpenChange }: FormularioContratoProps) {
  const { user } = useAuth()
  const { isAdmin, isFranqueado } = useUserRole()
  const queryClient = useQueryClient()
  const [franquiaIdDoFranqueado, setFranquiaIdDoFranqueado] = useState<string>()

  // Buscar franquia do franqueado logado
  useEffect(() => {
    const fetchFranquia = async () => {
      if (!isFranqueado || !user?.id) return
      
      const { data } = await supabase
        .from('franquias')
        .select('id')
        .eq('master_franqueado_id', user.id)
        .single()
      
      if (data) {
        setFranquiaIdDoFranqueado(data.id)
      }
    }

    if (isFranqueado) {
      fetchFranquia()
    }
  }, [isFranqueado, user?.id])

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

  // Buscar produtores (filtrados por franquia se for franqueado)
  const { data: produtores } = useQuery({
    queryKey: ['produtores-select', franquiaIdDoFranqueado],
    queryFn: async () => {
      // Buscar profiles com role produtor
      let query = supabase
        .from('profiles')
        .select('user_id, nome')
        .eq('role', 'produtor')
      
      const { data: allProdutores, error: profilesError } = await query
      
      if (profilesError) throw profilesError
      
      // Se for franqueado, filtrar por franquia através da tabela produtores
      if (isFranqueado && franquiaIdDoFranqueado) {
        const { data: produtoresFranquia } = await supabase
          .from('produtores')
          .select('user_id')
          .eq('franquia_id', franquiaIdDoFranqueado)
          .eq('ativo', true)
        
        const userIds = produtoresFranquia?.map(p => p.user_id) || []
        return allProdutores?.filter(p => userIds.includes(p.user_id)) || []
      }
      
      return allProdutores
    },
    enabled: !!(isAdmin || franquiaIdDoFranqueado)
  })

  const form = useForm<ContratoFormValues>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      franquia_id: franquiaIdDoFranqueado || '',
      produtor_id: '',
      numero_contrato: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      tipo_cobranca: 'mensal',
      dia_vencimento: 10,
      observacoes: '',
      valor_recebimento: undefined,
      valor_armazenagem: undefined,
      valor_expedicao_pallet: undefined,
      valor_expedicao_peca: undefined,
      slas: [],
      janelas_entrega: [],
    },
  })

  const { fields: slaFields, append: appendSla, remove: removeSla } = useFieldArray({
    control: form.control,
    name: "slas",
  })

  const { fields: janelaFields, append: appendJanela, remove: removeJanela } = useFieldArray({
    control: form.control,
    name: "janelas_entrega",
  })

  // Atualizar franquia_id quando o franqueado tem sua franquia carregada
  useEffect(() => {
    if (franquiaIdDoFranqueado) {
      form.setValue('franquia_id', franquiaIdDoFranqueado)
    }
  }, [franquiaIdDoFranqueado, form])

  const createContratoMutation = useMutation({
    mutationFn: async (values: ContratoFormValues) => {
      const insertData: any = {
        numero_contrato: values.numero_contrato,
        data_inicio: values.data_inicio,
        tipo_cobranca: values.tipo_cobranca,
        dia_vencimento: values.dia_vencimento,
        status: 'ativo',
      }

      // Adicionar campos opcionais
      if (values.franquia_id) insertData.franquia_id = values.franquia_id
      if (values.produtor_id) insertData.produtor_id = values.produtor_id
      if (values.data_fim) insertData.data_fim = values.data_fim
      if (values.observacoes) insertData.observacoes = values.observacoes
      if (user?.id) insertData.criado_por = user.id

      const { data: contrato, error } = await supabase
        .from('contratos_servico')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      // Inserir itens de serviço se valores foram fornecidos
      const servicosItens = []
      
      if (values.valor_recebimento) {
        servicosItens.push({
          contrato_id: contrato.id,
          tipo_servico: 'entrada_item',
          descricao: 'Serviço de Recebimento por Pallet',
          valor_unitario: values.valor_recebimento,
          quantidade_incluida: 0,
          valor_excedente: values.valor_recebimento,
        })
      }

      if (values.valor_armazenagem) {
        servicosItens.push({
          contrato_id: contrato.id,
          tipo_servico: 'armazenagem_pallet_dia',
          descricao: 'Serviço de Armazenagem por Pallet/Dia',
          valor_unitario: values.valor_armazenagem,
          quantidade_incluida: 0,
          valor_excedente: values.valor_armazenagem,
        })
      }

      if (values.valor_expedicao_pallet) {
        servicosItens.push({
          contrato_id: contrato.id,
          tipo_servico: 'saida_item',
          descricao: 'Serviço de Expedição por Pallet',
          valor_unitario: values.valor_expedicao_pallet,
          quantidade_incluida: 0,
          valor_excedente: values.valor_expedicao_pallet,
        })
      }

      if (values.valor_expedicao_peca) {
        servicosItens.push({
          contrato_id: contrato.id,
          tipo_servico: 'saida_item',
          descricao: 'Serviço de Expedição por Peça/Volume',
          valor_unitario: values.valor_expedicao_peca,
          quantidade_incluida: 0,
          valor_excedente: values.valor_expedicao_peca,
        })
      }

      if (servicosItens.length > 0) {
        const { error: servicosError } = await supabase
          .from('contrato_servicos_itens')
          .insert(servicosItens)

        if (servicosError) throw servicosError
      }

      // TODO: Implementar inserção de SLAs e Janelas após criar as migrações
      // As tabelas contrato_slas e contrato_janelas_entrega serão criadas em breve

      return contrato
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      queryClient.invalidateQueries({ queryKey: ['contrato-stats'] })
      toast.success('Contrato criado com sucesso!')
      form.reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Erro ao criar contrato:', error)
      
      // Verificar se é erro de número de contrato duplicado
      if (error.message?.includes('contratos_servico_numero_contrato_key') || 
          error.message?.includes('duplicate key')) {
        toast.error('Este número de contrato já existe. Por favor, use um número diferente.')
      } else {
        toast.error('Erro ao criar contrato: ' + error.message)
      }
    },
  })

  const onSubmit = (values: ContratoFormValues) => {
    createContratoMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados do contrato de serviço com o produtor
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Franquia - apenas visível para admin */}
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="franquia_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Franquia *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
              )}

              {/* Produtor */}
              <FormField
                control={form.control}
                name="produtor_id"
                render={({ field }) => (
                  <FormItem className={isAdmin ? '' : 'md:col-span-2'}>
                    <FormLabel>Produtor *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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

              {/* Número do Contrato */}
              <FormField
                control={form.control}
                name="numero_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Contrato *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: CTR-2025-001"
                        {...field}
                      />
                    </FormControl>
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
                      <Input
                        type="date"
                        {...field}
                      />
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
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe vazio para contrato indeterminado
                    </FormDescription>
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="por_demanda">Por Demanda</SelectItem>
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
                        min={1}
                        max={31}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Dia do mês (1 a 31)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valores dos Serviços */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold mb-4">Valores dos Serviços</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor_recebimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Recebimento (R$/pallet)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_armazenagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Armazenagem (R$/pallet/mês)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_expedicao_pallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Expedição Pallet (R$/pallet)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_expedicao_peca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Expedição Peça (R$/peça)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o contrato"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SLAs */}
            <div className="col-span-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">SLAs (Opcional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSla({
                    tipo_sla: 'prazo_recebimento',
                    descricao: '',
                    valor_meta: 0,
                    unidade_medida: '',
                    penalidade_descumprimento: '',
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar SLA
                </Button>
              </div>

              {slaFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">SLA {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSla(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

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
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prazo_recebimento">Prazo de Recebimento</SelectItem>
                              <SelectItem value="prazo_expedicao">Prazo de Expedição</SelectItem>
                              <SelectItem value="disponibilidade_estoque">Disponibilidade de Estoque</SelectItem>
                              <SelectItem value="acuracia_inventario">Acurácia de Inventário</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`slas.${index}.valor_meta`}
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
                      name={`slas.${index}.descricao`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Recebimento em até 24h" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`slas.${index}.unidade_medida`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de Medida *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: horas, dias, %" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`slas.${index}.penalidade_descumprimento`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Penalidade por Descumprimento</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva a penalidade aplicável"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Janelas de Entrega */}
            <div className="col-span-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Janelas de Entrega (Opcional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendJanela({
                    dia_semana: 1,
                    horario_inicio: '08:00',
                    horario_fim: '18:00',
                    capacidade_maxima: undefined,
                    observacoes: '',
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Janela
                </Button>
              </div>

              {janelaFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Janela {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeJanela(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`janelas_entrega.${index}.dia_semana`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da Semana *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                      name={`janelas_entrega.${index}.capacidade_maxima`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidade Máxima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Ex: 10 pallets"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`janelas_entrega.${index}.horario_inicio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário Início *</FormLabel>
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
                          <FormLabel>Horário Fim *</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
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
                            <Textarea
                              placeholder="Observações sobre a janela de entrega"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createContratoMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createContratoMutation.isPending}
              >
                {createContratoMutation.isPending ? 'Criando...' : 'Criar Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
