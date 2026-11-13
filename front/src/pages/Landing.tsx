import { Link } from "react-router-dom";
import { ArrowUp, Sparkles, ArrowUpRight, Check } from "lucide-react";
import Header from "../components/Header";

const steps = [
  {
    number: "01",
    icon: ArrowUp,
    title: "Загрузите лекцию",
    description: "Начните с файла .txt, .docx, .pdf или .pptx. Ваши материалы — это всё, что нужно.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Создайте тест",
    description: "Искусственный интеллект сгенерирует вопросы и объяснения на основе вашей лекции.",
  },
  {
    number: "03",
    icon: ArrowUpRight,
    title: "Поделитесь со студентами",
    description: "Опубликуйте тест и скопируйте ссылку. Студенты смогут пройти его с любого устройства.",
  },
  {
    number: "04",
    icon: Check,
    title: "Учитесь на практике",
    description: "Студенты получат подробный фидбек и увидят свои результаты.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Header
        right={
          <>
            <Link
              to="/login"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Регистрация
            </Link>
          </>
        }
      />

      {/* Hero */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:px-20">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
            ОТ ЛЕКЦИИ К ЗНАНИЯМ
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-[56px]">
            Генератор интерактивных обучающих тестов
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            Меньше времени на подготовку. Больше времени на обучение. Превращайте свои лекции в интерактивные тесты, которые помогают студентам учиться и понимать материал.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Попробовать бесплатно
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Войти
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Загрузите лекцию. Создайте тест. Поделитесь со студентами.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-20">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Как это работает</h2>
        <p className="mt-4 text-lg text-slate-500">
          Ваши учебные материалы, превращенные в полезную практику.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200 p-6 transition hover:border-slate-300"
            >
              <step.icon className="h-6 w-6 text-slate-700" strokeWidth={2} />
              <p className="mt-8 text-xs font-semibold text-slate-400">{step.number}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-20">
          <p className="text-lg font-extrabold tracking-tight text-slate-900">GITS</p>
          <p className="text-sm text-slate-400">Создан для преподавания. Спроектирован для обучения.</p>
        </div>
      </footer>
    </div>
  );
}