import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Package, Plus } from "lucide-react"

interface Produto {
  id: string
  nome: string
  codigo: string | null
  categoria: string | null
  unidade_medida: string
  descricao: string | null
  ativo: boolean | null
}

export default function Catalogo() {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const schema = z.object({
    nome: z.string().min(1, "Nome obrigatório"),
    unidade_medida: z.string().min(1, "Unidade obrigatória"),
    codigo: z.string().optional(),
    categoria: z.string().optional(),
    descricao: z.string().optional(),
    ativo: z.boolean().default(true),
  })
  type FormValues = z.infer<typeof schema>

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", unidade_medida: "", codigo: "", categoria: "", descricao: "", ativo: true }
  })

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: "destructive", description: "Você precisa estar autenticado." })
      return
    }
    const { error } = await supabase.from("produtos").insert({
      user_id: user.id,
      nome: values.nome,
      unidade_medida: values.unidade_medida,
      codigo: values.codigo || null,
      categoria: values.categoria || null,
      descricao: values.descricao || null,
      ativo: values.ativo,
    })
    if (error) {
      toast({ variant: "destructive", description: "Erro ao cadastrar produto." })
      return
    }
    toast({ description: "Produto cadastrado com sucesso." })
    setOpen(false)
    reset()
    queryClient.invalidateQueries({ queryKey: ["produtos"] })
  }
  const { data: produtos = [], isLoading, error } = useQuery<Produto[]>({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, codigo, categoria, unidade_medida, descricao, ativo")
        .order("nome", { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return produtos
    return produtos.filter((p) =>
      [p.nome, p.codigo, p.categoria, p.unidade_medida]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    )
  }, [q, produtos])

  useEffect(() => {
    document.title = "Catálogo de Produtos | AgroStock"

    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement("meta")
    metaDesc.setAttribute("name", "description")
    metaDesc.setAttribute("content", "Catálogo de produtos cadastrados na AgroStock")
    document.head.appendChild(metaDesc)

    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement("link")
    linkCanonical.setAttribute("rel", "canonical")
    linkCanonical.setAttribute("href", `${window.location.origin}/catalogo`)
    document.head.appendChild(linkCanonical)
  }, [])

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filtered.map((p, idx) => ({
      "@type": "Product",
      position: idx + 1,
      name: p.nome,
      sku: p.codigo || undefined,
      category: p.categoria || undefined,
      description: p.descricao || undefined,
    })),
  }), [filtered])

  return (
    <article>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de Produtos</h1>
          <p className="text-sm text-muted-foreground">Consulte os produtos cadastrados e filtre pelo nome, código ou categoria.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Novo produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" {...register("nome")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" {...register("codigo")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input id="categoria" {...register("categoria")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidade_medida">Unidade de medida</Label>
                  <Input id="unidade_medida" placeholder="ex: kg, un, lt" {...register("unidade_medida")} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" rows={3} {...register("descricao")} />
              </div>
              <Controller
                name="ativo"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="mb-6">
        <Input
          placeholder="Pesquisar por nome, código ou categoria..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Pesquisar produtos"
        />
      </section>

      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section aria-busy={isLoading} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i}`} className="shadow-card animate-pulse">
            <CardHeader>
              <div className="h-5 w-2/3 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-4 w-1/3 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}

        {!isLoading && error && (
          <div className="col-span-full text-destructive">Erro ao carregar produtos.</div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <Card className="shadow-card col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum produto encontrado.
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filtered.map((p) => (
          <Card key={p.id} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">{p.nome}</CardTitle>
              </div>
              <Badge variant={p.ativo ? "default" : "secondary"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {p.codigo && (
                <p><span className="font-medium text-foreground">Código:</span> {p.codigo}</p>
              )}
              {p.categoria && (
                <p><span className="font-medium text-foreground">Categoria:</span> {p.categoria}</p>
              )}
              <p><span className="font-medium text-foreground">Unidade:</span> {p.unidade_medida}</p>
              {p.descricao && (
                <p className="line-clamp-2"><span className="font-medium text-foreground">Descrição:</span> {p.descricao}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </article>
  )
}
