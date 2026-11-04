import json
import random
import re
from pathlib import Path
from pydantic import BaseModel
from llama_cpp import Llama

class Question(BaseModel):
    type: str = "single_choice"
    question: str
    options: list[str]
    correct_index: int
    explanation: str

class Quiz(BaseModel):
    title: str
    questions: list[Question]

MODEL_PATH = Path(__file__).parent / "models" / "Qwen3-1.7B-Q4_K_M.gguf"

print("Загрузка LLM модели в память...")
llm = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=4096,
    verbose=False
)
print("Модель успешно загружена!")

SYSTEM_PROMPT = """Ты — эксперт по созданию образовательных тестов.
Отвечай ТОЛЬКО валидным JSON. Без markdown.
Пиши варианты ответов БЕЗ букв (A, B, C, D) в начале.
Формат:
{
  "title": "Название",
  "questions": [
    {
      "type": "single_choice",
      "question": "Текст вопроса?",
      "options": ["Первый вариант", "Второй вариант", "Третий вариант", "Четвертый вариант"],
      "correct_index": 0,
      "explanation": "Объяснение"
    }
  ]
}
"""

def clean_option(opt: str) -> str:
    
    return re.sub(r'^[A-Za-zА-Яа-я][\.\)]\s*', '', opt.strip())

def generate_quiz(text: str, num_questions: int = 5, max_retries: int = 3) -> Quiz:
    prompt = f"Создай уникальный тест из {num_questions} вопросов по этому тексту. Не повторяй вопросы:\n\n{text}"

    for attempt in range(max_retries):
        try:
            response = llm.create_chat_completion(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8, # Еще чуть-чуть повысим креативность
                top_p=0.9,
                max_tokens=2048
            )
            raw = response["choices"][0]["message"]["content"]

            
            start = raw.find('{')
            end = raw.rfind('}')
            if start == -1 or end == -1:
                raise ValueError("No JSON found")
            json_str = raw[start:end + 1]

            data = json.loads(json_str)
            
            for q in data["questions"]:
            
                q["options"] = [clean_option(opt) for opt in q["options"]]
                
                
                correct_answer_text = q["options"][q["correct_index"]]
                
                
                random.shuffle(q["options"])
                
                
                q["correct_index"] = q["options"].index(correct_answer_text)

            return Quiz(**data)

        except Exception as e:
            if attempt == max_retries - 1:
                raise RuntimeError(f"LLM failed: {str(e)}")
            continue