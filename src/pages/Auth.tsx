import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_RULES, passwordIsValid, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const AuthPage = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const rules = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const canSubmit =
    email.trim().length > 3 &&
    password.length > 0 &&
    (mode === "signin" || (passwordIsValid(password) && password === confirm));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) setError(error.message);
      else if (!data.session)
        setNotice("Check your email for a confirmation link, then come back and sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError(
          error.message.toLowerCase().includes("invalid login")
            ? "That email and password don't match an account."
            : error.message,
        );
      }
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-sm animate-rise">
        <Lock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="mt-6 font-display text-3xl leading-tight">
          {mode === "signup" ? "Make your private space" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {mode === "signup"
            ? "Your entries, recordings and preferences are saved to your account only. No one else can read them."
            : "Sign in to reach your entries and preferences."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 rounded-xl bg-card"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 rounded-xl bg-card"
              required
            />
          </div>

          {mode === "signup" && (
            <>
              <ul className="space-y-1.5 rounded-xl bg-secondary/60 p-4">
                {rules.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      r.ok ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Check className={cn("h-3.5 w-3.5", !r.ok && "opacity-30")} />
                    {r.label}
                  </li>
                ))}
              </ul>

              <div>
                <label htmlFor="confirm" className="text-sm text-muted-foreground">
                  Repeat password
                </label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-card"
                  required
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-2 text-xs text-destructive">These two don't match yet.</p>
                )}
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

          <Button type="submit" disabled={!canSubmit || busy || authLoading} className="h-12 w-full rounded-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setNotice(null);
          }}
          className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {mode === "signup" ? "I already have an account" : "I need an account"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
