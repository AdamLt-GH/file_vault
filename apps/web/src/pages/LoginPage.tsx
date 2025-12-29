import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { LoginForm } from "../features/auth/LoginForm";
import type { Administrator, SessionResponse } from "../features/auth/api";
import { sessionQueryKey } from "../features/auth/useSession";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleLoggedIn(administrator: Administrator): void {
    queryClient.setQueryData<SessionResponse>(sessionQueryKey, {
      user: administrator,
    });
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="vault-mark" aria-hidden="true">
          FV
        </div>
        <p className="eyebrow">Private NAS storage</p>
        <h1>Welcome back</h1>
        <p className="login-copy">Sign in with your File Vault administrator account.</p>
        <LoginForm onLoggedIn={handleLoggedIn} />
      </section>
    </main>
  );
}
