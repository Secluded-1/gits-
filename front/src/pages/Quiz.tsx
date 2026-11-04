import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import Header from "../components/Header";
import {
  apiGetPublicQuiz,
  apiSubmitAttempt,
  type Question,
  type AttemptResult,
} from "../lib/api";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Quiz() {
  const { quizId } = useParams<{ quizId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finishedData, setFinishedData] = useState<AttemptResult | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      if (!quizId) {
        setError("Не указан идентификатор теста");
        setLoading(false);
        return;
      }
      try {
        const data = await apiGetPublicQuiz(quizId);
        setQuizTitle(data.title);
        setQuestions(data.questions);
        setStartedAt(Date.now());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const total = questions.length;
  const isFinished = finishedData !== null;
  const question = !isFinished && currentIndex < total ? questions[currentIndex] : null;
  const headerPercent = isFinished ? 100 : Math.round(((currentIndex + 1) / total) * 100);

  function handleSelect(optionIndex: number) {
    if (selected !== null || !question) return;
    setSelected(optionIndex);
  }

  async function handleNext() {
    if (selected === null || !question) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentIndex + 1 >= total) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      try {
        const result = await apiSubmitAttempt(quizId!, newAnswers, elapsed);
        setFinishedData(result);
        setFinishedAt(Date.now());
      } catch (err) {
        console.error("Не удалось сохранить результат:", err);
        let score = 0;
        newAnswers.forEach((ans, i) => {
          if (ans === questions[i].correct_index) score++;
        });
        setFinishedData({
          score,
          total,
          percentage: Math.round((score / total) * 100),
        });
        setFinishedAt(Date.now());
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setFinishedData(null);
    setFinishedAt(null);
    setStartedAt(Date.now());
  }

  const headerRight = (
    <span className="text-sm text-slate-400">Interactive Training Simulator Generator</span>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header right={headerRight} />
        <div className="pt-20 text-center text-slate-500">Загрузка теста...</div>
      </div>
    );
  }

  if (error || !questions.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header right={headerRight} />
        <div className="pt-20 text-center text-red-500">
          {error || "Тест пуст или не найден"}
        </div>
      </div>
    );
  }

  if (isFinished) {
    const elapsed = (finishedAt ?? Date.now()) - startedAt;
    return (
      <div className="min-h-screen bg-slate-50">
        <Header right={headerRight} />
        <div className="mx-auto max-w-2xl px-6 pt-20 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400">
            QUIZ COMPLETE
          </p>
          <p className="mt-3 text-lg text-slate-500">{quizTitle}</p>

          <p className="mt-10 text-8xl font-extrabold tracking-tight text-slate-900">
            {finishedData!.score}/{finishedData!.total}
          </p>
          <p className="mt-6 text-lg text-slate-500">
            You answered {finishedData!.score} out of {finishedData!.total} questions correctly
          </p>

          <div className="mt-10 grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200 py-6">
            <div>
              <p className="text-sm text-slate-400">Score</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {finishedData!.percentage}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Time spent</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatTime(elapsed)}
              </p>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="mx-auto mt-10 rounded-lg bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const hasAnswered = selected !== null;
  const isCorrect = hasAnswered && selected === question.correct_index;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header right={headerRight} />

      <div className="mx-auto max-w-3xl px-6 pb-16 pt-12">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-900">
            Question {currentIndex + 1} of {total}
          </p>
          <p className="text-slate-400">{headerPercent}%</p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${headerPercent}%` }}
          />
        </div>

        <h1 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
          {question.question}
        </h1>
        <p className="mt-3 text-sm text-slate-400">Choose one answer.</p>

        <div className="mt-6 space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selected === idx;
            const isCorrectOption = idx === question.correct_index;

            let stateClasses =
              "border-slate-200 bg-white text-slate-900 hover:border-slate-300";
            let circleClasses = "border-slate-300 text-slate-700";
            let icon: ReactNode = null;

            if (hasAnswered) {
              if (isCorrectOption) {
                stateClasses = "border-green-500 bg-green-50 text-green-700";
                circleClasses = "border-green-500 text-green-700";
                icon = (
                  <CheckCircle2 className="h-5 w-5 text-green-600" strokeWidth={1.75} />
                );
              } else if (isSelected) {
                stateClasses = "border-red-400 bg-red-50 text-red-700";
                circleClasses = "border-red-400 text-red-700";
                icon = <XCircle className="h-5 w-5 text-red-500" strokeWidth={1.75} />;
              }
            }

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
                className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition ${stateClasses} ${
                  hasAnswered ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${circleClasses}`}
                  >
                    {LETTERS[idx]}
                  </span>
                  <span className="text-base">{option}</span>
                </span>
                {icon}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="mt-6 rounded-xl border border-slate-200 p-6">
            {isCorrect ? (
              <p className="text-base font-semibold text-green-600">
                Correct — well done.
              </p>
            ) : (
              <p className="text-base font-semibold text-red-600">
                Incorrect — the correct answer is {LETTERS[question.correct_index]}.
              </p>
            )}
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Why this is correct
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {question.explanation}
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!hasAnswered}
            className={`rounded-lg px-8 py-3 text-sm font-semibold transition ${
              hasAnswered
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "cursor-not-allowed bg-slate-400 text-white"
            }`}
          >
            {currentIndex + 1 >= total ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}