import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * @deprecated Use RequireAdmin or module-based access control instead
 * This component now allows admin and cliente roles since operador was merged into cliente
 */
export function RequireAdminOrFranqueado({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      allowedRoles={["admin", "cliente"]}
    >
      {children}
    </ProtectedRoute>
  );
}
