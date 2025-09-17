import { FormularioGenerico } from "@/components/Formularios/FormularioGenerico";

interface FormularioSaidaProps {
  onSubmit: (dados: any) => void
  onCancel: () => void
}

export function FormularioSaida({ onSubmit, onCancel }: FormularioSaidaProps) {
  return (
    <FormularioGenerico
      tipo="saida"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}