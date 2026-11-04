const API_URL = "";

export function getToken(): string | null {
  return localStorage.getItem("gits_token");
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

//АУТЕНТИФИКАЦИЯ

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка входа");
  }
  const data: AuthResponse = await res.json();
  localStorage.setItem("gits_token", data.access_token);
  return data;
}

export async function apiRegister(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка регистрации");
  }
  const data: AuthResponse = await res.json();
  localStorage.setItem("gits_token", data.access_token);
  return data;
}

export function apiLogout(): void {
  localStorage.removeItem("gits_token");
}

//ЗАГРУЗКА ФАЙЛОВ

export async function apiUploadFile(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка загрузки файла");
  }
  return res.json();
}

//ГЕНЕРАЦИЯ ТЕСТА

export interface Question {
  type: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  public_slug: string;
  questions: Question[];
}

export async function apiGenerateQuiz(title: string, text: string): Promise<GeneratedQuiz> {
  const res = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ title, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка генерации");
  }
  return res.json();
}

//СПИСОК ТЕСТОВ 

export interface QuizMeta {
  id: string;
  title: string;
  public_slug: string;
  created_at: string;
}

export async function apiGetMyQuizzes(): Promise<QuizMeta[]> {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Не удалось загрузить список тестов");
  return res.json();
}

//ПУБЛИЧНЫЙ ТЕСТ

export interface PublicQuiz {
  title: string;
  questions: Question[];
}

export async function apiGetPublicQuiz(slug: string): Promise<PublicQuiz> {
  const res = await fetch(`${API_URL}/api/public/${slug}`);
  if (!res.ok) throw new Error("Тест не найден");
  return res.json();
}

//ОТПРАВКА ОТВЕТОВ

export interface AttemptResult {
  score: number;
  total: number;
  percentage: number;
}

export async function apiSubmitAttempt(
  slug: string,
  answers: number[],
  duration_sec: number,
  student_name: string = "Студент"
): Promise<AttemptResult> {
  const res = await fetch(`${API_URL}/api/public/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_name, answers, duration_sec }),
  });
  if (!res.ok) throw new Error("Ошибка сохранения результата");
  return res.json();
}