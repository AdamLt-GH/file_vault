import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "./useSession";

interface RouteGuardProps {
  children: ReactNode;
}

function SessionLoading() {
  return (
    <main className="session-loading" aria-busy="true">
      Checking your session...
    </main>
  );
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const session = useSession();

  if (session.isPending) return <SessionLoading />;
  if (!session.data?.user) return <Navigate to="/login" replace />;

  return children;
}

export function SignedOutRoute({ children }: RouteGuardProps) {
  const session = useSession();

  if (session.isPending) return <SessionLoading />;
  if (session.data?.user) return <Navigate to="/dashboard" replace />;

  return children;
}

