import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoute";

interface RequirePageAccessProps {
  children: ReactNode;
  pageKey: string;
}

export function RequirePageAccess({ children, pageKey }: RequirePageAccessProps) {
  return (
    <ProtectedRoute 
      requireAuth={true}
      pageKey={pageKey}
    >
      {children}
    </ProtectedRoute>
  );
}