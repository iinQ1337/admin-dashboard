import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-wide text-primary">Панель мониторинга</p>
          <h1 className="text-2xl font-semibold">Вход</h1>
          <p className="text-sm text-muted-foreground">Авторизуйтесь, чтобы продолжить</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
