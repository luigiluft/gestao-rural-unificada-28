import { useEffect } from "react";

export default function Franqueados() {
  useEffect(() => {
    document.title = "Franqueados | AgroStock";
  }, []);

  return (
    <main>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Franqueados</h1>
        <p className="text-muted-foreground">Gerencie os franqueados e seus acessos.</p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Em breve: lista de franqueados, convites e permissões.</p>
      </section>
    </main>
  );
}
