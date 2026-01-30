import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const { login, checkAppState, authError, isLoadingAuth, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    // Se já estiver logado e cair aqui por algum motivo, manda pro app
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Garante que, ao abrir /login, o estado está atualizado (cookie pode já existir)
    checkAppState?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Preencha email e senha.");
      return;
    }

    try {
      setSubmitting(true);
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setFormError("Credenciais inválidas.");
      } else {
        setFormError(err?.message || "Erro ao fazer login.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showAuthError =
    authError && authError.type !== "auth_required" ? authError.message : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Use seu email e senha para acessar.
          </p>
        </div>

        {showAuthError ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {showAuthError}
          </div>
        ) : null}

        {formError ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || isLoadingAuth}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || isLoadingAuth}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || isLoadingAuth}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
