import { Link } from "react-router-dom"
import { useLojasParceiras } from "@/hooks/useLojasParceiras"
import { Card, CardContent } from "@/components/ui/card"
import { Store, Loader2, ExternalLink } from "lucide-react"

export default function Parceiros() {
  const { data: lojas, isLoading } = useLojasParceiras()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Nossos Parceiros
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conheça as lojas parceiras que fazem parte da nossa rede. Produtos de qualidade 
            direto do produtor para você.
          </p>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !lojas || lojas.length === 0 ? (
            <div className="text-center py-16">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma loja parceira ainda</h3>
              <p className="text-muted-foreground">
                Em breve teremos lojas parceiras disponíveis para você.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {lojas.map((loja) => (
                <Link key={loja.id} to={`/loja/${loja.slug}`}>
                  <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden mb-4 flex items-center justify-center">
                        {loja.logo_url ? (
                          <img
                            src={loja.logo_url}
                            alt={loja.nome_loja}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                        {loja.nome_loja}
                      </h3>
                      {loja.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {loja.descricao}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Visitar loja</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Quer ser um parceiro?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Se você é produtor rural e quer vender seus produtos em nossa plataforma, 
            entre em contato conosco.
          </p>
          <Link
            to="/site/contato"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Entrar em contato
          </Link>
        </div>
      </section>
    </div>
  )
}
