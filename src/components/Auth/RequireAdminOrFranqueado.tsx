import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

export function RequireAdminOrFranqueado({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      allowedRoles={["admin", "operador"]}
    >
      {children}
    </ProtectedRoute>
  );
}