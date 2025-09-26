import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      loadingMessage="Carregando..."
    >
      {children}
    </ProtectedRoute>
  );
}
