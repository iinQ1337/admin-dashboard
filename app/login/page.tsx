import { LoginForm } from "@/components/auth/login-form";
import { createTranslator } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n-server";

export default function LoginPage() {
  const locale = resolveLocale();
  const t = createTranslator(locale);
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-wide text-primary">{t("Панель мониторинга", "Monitoring dashboard")}</p>
          <h1 className="text-2xl font-semibold">{t("Вход", "Login")}</h1>
          <p className="text-sm text-muted-foreground">{t("Авторизуйтесь, чтобы продолжить", "Sign in to continue")}</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
