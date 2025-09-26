import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      allowedRoles={["admin"]}
    >
      {children}
    </ProtectedRoute>
  );
}
