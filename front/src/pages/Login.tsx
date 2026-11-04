import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { apiLogin } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await apiLogin(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-6 pt-16">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Вход в систему</h1>
        <p className="mt-2 text-sm text-slate-500">Введите email и пароль.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="teacher@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isLoading ? "Вход..." : "Войти"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Нет аккаунта?{" "}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}