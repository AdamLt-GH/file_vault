import { useNavigate } from "react-router-dom";

import { LoginForm } from "../features/auth/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="vault-mark" aria-hidden="true">
          FV
        </div>
        <p className="eyebrow">Private NAS storage</p>
        <h1>Welcome back</h1>
        <p className="login-copy">Sign in with your File Vault administrator account.</p>
        <LoginForm onLoggedIn={() => navigate("/dashboard", { replace: true })} />
      </section>
    </main>
  );
}

