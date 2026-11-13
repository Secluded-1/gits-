import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import Header from "../components/Header";
import { logout } from "../lib/auth";
import {
  apiGenerateQuiz,
  apiGetMyQuizzes,
  getToken,
  type QuizMeta,
  apiUploadFile,
} from "../lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      const data = await apiGetMyQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error("Не удалось загрузить тесты:", err);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleFiles(files: FileList | null) {
    if (files && files.length > 0) setFileName(files[0].name);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleGenerateQuiz() {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      let textToSend = "";
      
      if (fileInputRef.current?.files?.length) {
        setToast("Читаем файл...");
        const file = fileInputRef.current.files[0];
        const uploadRes = await apiUploadFile(file);
        textToSend = uploadRes.text;
      } else {
        setToast("Ошибка: выберите файл с лекцией");
        setIsLoading(false);
        return;
      }

      setToast("Генерируем вопросы через ИИ...");
      const title = fileName
        ? fileName.replace(/\.[^/.]+$/, "")
        : `Тест по лекции (${new Date().toLocaleTimeString()})`;

      const result = await apiGenerateQuiz(title, textToSend);

      setToast(`Тест «${result.title}» создан!`);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadQuizzes();
    } catch (err: any) {
      setToast(`Ошибка: ${err.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  function handleCopyLink(slug: string) {
    const link = `${window.location.origin}${window.location.pathname}#/quiz/${slug}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedId(slug);
    setTimeout(() => setCopiedId((c) => (c === slug ? null : c)), 1800);
  }

  function formatDate(dateStr: string) {
    return `Создан ${new Date(dateStr).toLocaleDateString("ru-RU", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        right={
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Выйти
          </button>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Панель преподавателя
        </h1>
        <p className="mt-2 text-slate-500">Превратите лекции в полезную практику.</p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
          <h2 className="text-xl font-bold text-slate-900">Загрузите новую лекцию</h2>

          <div className="mt-5 flex flex-col items-center gap-4 md:flex-row">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging ? "border-slate-400 bg-slate-50" : "border-slate-200"
              }`}
            >
              <UploadCloud className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-medium text-slate-700">
                {fileName ? fileName : "Перетащите файл сюда или нажмите для выбора"}
              </p>
              <p className="mt-2 text-xs text-slate-400">.txt, .docx, .pdf, .pptx</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf,.pptx"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={isLoading}
              className="w-full shrink-0 rounded-lg bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400 md:w-auto"
            >
              {isLoading ? "Генерация..." : "Создать тест"}
            </button>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Мои тесты</h2>
            <p className="text-sm text-slate-400">{quizzes.length} шт.</p>
          </div>

          <div className="mt-5 space-y-4">
            {quizzes.length === 0 && (
              <p className="py-10 text-center text-slate-400">
                Пока нет тестов. Загрузите лекцию и нажмите «Создать тест».
              </p>
            )}

            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  onClick={() => navigate(`/quiz/${quiz.public_slug}`)}
                  className="text-left"
                >
                  <h3 className="text-lg font-bold text-slate-900 hover:underline">
                    {quiz.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(quiz.created_at)}</p>
                </button>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Опубликован
                  </span>
                  <button
                    onClick={() => handleCopyLink(quiz.public_slug)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    {copiedId === quiz.public_slug ? "Скопировано!" : "Копировать ссылку"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}