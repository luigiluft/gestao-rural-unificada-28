import { FormularioGenerico } from "@/components/Formularios/FormularioGenerico";
import { NFData } from "./NFParser";

interface FormularioEntradaProps {
  nfData?: NFData | null;
  onSubmit: (dados: any) => void;
  onCancel: () => void;
}

export function FormularioEntrada({ nfData, onSubmit, onCancel }: FormularioEntradaProps) {
  return (
    <FormularioGenerico
      tipo="entrada"
      nfData={nfData}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}