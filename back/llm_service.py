import html
import os
import random
import re
import threading
from pathlib import Path

from pydantic import BaseModel

try:
    from llama_cpp import Llama
except ImportError:  # pragma: no cover
    Llama = None


class Question(BaseModel):
    type: str = "single_choice"
    question: str
    options: list[str]
    correct_index: int
    explanation: str = ""


class Quiz(BaseModel):
    title: str
    questions: list[Question]



MODELS_DIR = Path(__file__).resolve().parent / "models"
DEFAULT_MODEL_FILENAME = "Qwen2.5-1.5B-Instruct-Multiple-Choice-Maker.Q4_K_M.gguf"


MODEL_PATH = Path(os.getenv("QUIZ_MODEL_PATH") or (MODELS_DIR / DEFAULT_MODEL_FILENAME))

N_CTX = int(os.getenv("QUIZ_MODEL_CTX", "8192"))          
MAX_ANSWER_TOKENS = int(os.getenv("QUIZ_MODEL_MAX_TOKENS", "1024"))  
N_THREADS = int(os.getenv("QUIZ_MODEL_THREADS", "0")) or None


INPUT_TEMPLATE = "Multiple choice:\n{text}"


INPUT_SUFFIX = os.getenv("QUIZ_MODEL_INPUT_SUFFIX", "")


DEFAULT_SYSTEM_PROMPT = (
    "Отвечай на русском языке: вопросы, варианты ответов и пояснения — только по-русски."
)
SYSTEM_PROMPT = os.getenv("QUIZ_MODEL_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT).strip()


STRICT_SUFFIX = " Пиши вопросы и варианты ответов ТОЛЬКО на русском языке, английский не использовать."


LANGUAGE_GUARD = os.getenv("QUIZ_MODEL_LANGUAGE_GUARD", "1") not in ("0", "false", "no")

_CYR_RE = re.compile(r"[А-Яа-яЁё]")

DEFAULT_TITLE = "Тест по материалу"

print(f"LLM: модель будет загружена по требованию из {MODEL_PATH}")

_llm = None
_llm_lock = threading.Lock()


def get_llm():
    """Ленивая загрузка модели: один раз на процесс, потокобезопасно."""
    global _llm
    if _llm is not None:
        return _llm

    with _llm_lock:
        if _llm is not None:
            return _llm

        if Llama is None:
            raise RuntimeError(
                "Не установлена библиотека llama-cpp-python. "
                "Установите зависимости: python -m pip install -r requirements.txt"
            )
        if not MODEL_PATH.is_file():
            raise RuntimeError(
                f"Файл модели не найден: {MODEL_PATH}. "
                "Запустите установку модели: python install_model.py"
            )

        print("Загрузка LLM модели в память...")
        _llm = Llama(
            model_path=str(MODEL_PATH),
            n_ctx=N_CTX,
            n_threads=N_THREADS,
            verbose=False,
        )
        print("Модель успешно загружена!")
        return _llm



_WS_RE = re.compile(r"\s+")
_CHOICE_RE = re.compile(
    r"<choice\s+id\s*=\s*[\"']([^\"']*)[\"']\s*>(.*?)</choice>", re.S | re.I
)
_ANSWER_RE = re.compile(r"<answer\s+value\s*=\s*[\"']([^\"']*)[\"']", re.I)


def _clean(value: str) -> str:
    text = html.unescape(value or "")
    text = _WS_RE.sub(" ", text).strip()
    return re.sub(r"^[A-Za-zА-Яа-я][\.\)]\s*", "", text)


def parse_quiz_xml(raw: str) -> list[dict]:
    if not raw:
        return []

    text = raw
    start = text.find("<quiz>")
    if start != -1:
        text = text[start:]

    blocks = re.findall(r"<multiple-choice>(.*?)</multiple-choice>", text, re.S | re.I)
    if not blocks:
        blocks = re.findall(r"<multiple-choice>(.*?)(?=<multiple-choice>|</quiz>|$)", text, re.S | re.I)

    questions: list[dict] = []
    seen: set[str] = set()

    for block in blocks:
        q_match = re.search(r"<question>(.*?)</question>", block, re.S | re.I)
        if not q_match:
            continue
        question = _clean(q_match.group(1))
        if not question or question in seen:
            continue

        choices = [(cid.strip().lower(), _clean(cbody)) for cid, cbody in _CHOICE_RE.findall(block)]
        choices = [(cid, body) for cid, body in choices if body]
        if len(choices) < 2:
            continue

        answer_match = _ANSWER_RE.search(block)
        if not answer_match:
            continue
        answer_key = _clean(answer_match.group(1)).lower()

        ids = [cid for cid, _ in choices]
        if answer_key in ids:
            correct_index = ids.index(answer_key)
        else:
            bodies = [body.lower() for _, body in choices]
            if answer_key not in bodies:
                continue
            correct_index = bodies.index(answer_key)

        options = [body for _, body in choices]
        correct_text = options[correct_index]

        explanation_match = re.search(r"<explanation>(.*?)</explanation>", block, re.S | re.I)
        explanation = _clean(explanation_match.group(1)) if explanation_match else ""

        random.shuffle(options)
        correct_index = options.index(correct_text)

        if not explanation:
            explanation = f"Правильный ответ: {correct_text}"

        seen.add(question)
        questions.append(
            {
                "type": "single_choice",
                "question": question,
                "options": options,
                "correct_index": correct_index,
                "explanation": explanation,
            }
        )

    return questions




def build_model_input(text: str) -> str:
    return INPUT_TEMPLATE.format(text=text.strip()) + INPUT_SUFFIX


def _fit_context(model, text: str) -> str:
    budget = max(256, N_CTX - MAX_ANSWER_TOKENS - 128)
    try:
        ids = model.tokenize(text.encode("utf-8"), add_bos=False)
        if len(ids) <= budget:
            return text
        return model.detokenize(ids[:budget]).decode("utf-8", errors="ignore")
    except Exception:
        return text[: budget * 3] 


def _cyrillic_ratio(value: str) -> float:
    letters = [ch for ch in value if ch.isalpha()]
    if not letters:
        return 0.0
    return len(_CYR_RE.findall("".join(letters))) / len(letters)


def _is_russian_source(text: str) -> bool:
    return _cyrillic_ratio(text) >= 0.3


def _quiz_is_russian(questions: list[dict]) -> bool:
    joined = " ".join(
        q["question"] + " " + " ".join(q["options"]) for q in questions
    )
    return _cyrillic_ratio(joined) >= 0.1


def generate_quiz(text: str, num_questions: int = 5, max_retries: int = 3,
                  title: str | None = None) -> Quiz:
    if not text or not text.strip():
        raise ValueError("Пустой текст")

    model = get_llm()
    prompt = build_model_input(_fit_context(model, text))

    russian_source = LANGUAGE_GUARD and _is_russian_source(text)
    system_prompt = SYSTEM_PROMPT

    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = model.create_chat_completion(
                messages=messages,
                temperature=0.3 if attempt == 0 else 0.6,
                top_p=0.9,
                top_k=20,
                repeat_penalty=1.1, 
                max_tokens=MAX_ANSWER_TOKENS,
                stop=["</quiz>"],
            )
            raw = response["choices"][0]["message"]["content"] or ""

            questions = parse_quiz_xml(raw)
            if not questions:
                raise ValueError("Модель не вернула ни одного вопроса")

            if russian_source and not _quiz_is_russian(questions):
                system_prompt = (system_prompt or DEFAULT_SYSTEM_PROMPT) + STRICT_SUFFIX
                raise ValueError("Модель ответила не по-русски")

            questions = questions[:num_questions]
            return Quiz(
                title=title or DEFAULT_TITLE,
                questions=[Question(**q) for q in questions],
            )

        except Exception as e:  
            last_error = e
            if attempt == max_retries - 1:
                break

    raise RuntimeError(f"LLM failed: {last_error}")
