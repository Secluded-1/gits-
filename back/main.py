from pathlib import Path
import json
import uuid
import io
import docx
import PyPDF2
from pptx import Presentation
from fastapi import FastAPI, Depends, HTTPException, Header, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import get_db
from schemas import UserRegister, UserLogin, TokenResponse, GenerateRequest, AttemptSubmit
from auth import hash_password, verify_password, create_access_token, decode_access_token
from llm_service import generate_quiz

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="GITS API v1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/auth/register", response_model=TokenResponse)
def register(data: UserRegister, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=409, detail="Email занят")

    cursor.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (data.email, hash_password(data.password))
    )
    db.commit()
    user_id = cursor.lastrowid
    token = create_access_token({"sub": str(user_id), "email": data.email})
    return TokenResponse(access_token=token)


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: UserLogin, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (data.email,))
    user = cursor.fetchone()
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    token = create_access_token({"sub": str(user["id"]), "email": data.email})
    return TokenResponse(access_token=token)


def _get_user_id(authorization: str, db):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Нужна авторизация")
    payload = decode_access_token(authorization.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=401, detail="Невалидный токен")
    return int(payload["sub"])


@app.post("/api/upload")
async def upload_lecture(file: UploadFile = File(...), authorization: str = Header(None), db=Depends(get_db)):
    # Проверка авторизации
    user_id = _get_user_id(authorization, db)
    
    content = await file.read()
    text = ""
    filename = file.filename.lower()

    try:
        if filename.endswith(".txt"):
            text = content.decode("utf-8")
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".pdf"):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif filename.endswith(".pptx"):
            prs = Presentation(io.BytesIO(content))
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения файла: {str(e)}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Файл пуст или не содержит текста")

    return {"text": text}


@app.post("/api/generate")
@limiter.limit("10/hour")
def generate(request: Request, data: GenerateRequest, authorization: str = Header(None), db=Depends(get_db)):
    user_id = _get_user_id(authorization, db)

    if len(data.text) > 10000:
        raise HTTPException(status_code=400, detail="Текст больше 10 000 символов")

    try:
        quiz = generate_quiz(data.text, num_questions=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка LLM: {str(e)}")

    public_slug = str(uuid.uuid4())[:8]
    questions_json = json.dumps({"title": quiz.title, "questions": [q.model_dump() for q in quiz.questions]},
                                ensure_ascii=False)

    cursor = db.cursor()
    cursor.execute(
        """INSERT INTO quizzes (user_id, title, source_text, questions_json, public_slug)
           VALUES (?, ?, ?, ?, ?)""",
        (user_id, data.title, data.text, questions_json, public_slug)
    )
    db.commit()
    quiz_id = cursor.lastrowid

    return {
        "id": quiz_id,
        "title": quiz.title,
        "public_slug": public_slug,
        "questions": [q.model_dump() for q in quiz.questions]
    }


@app.get("/api/quizzes")
def get_my_quizzes(authorization: str = Header(None), db=Depends(get_db)):
    user_id = _get_user_id(authorization, db)
    cursor = db.cursor()
    cursor.execute("SELECT id, title, public_slug, created_at FROM quizzes WHERE user_id = ? ORDER BY created_at DESC",
                   (user_id,))
    rows = cursor.fetchall()
    return [dict(r) for r in rows]


@app.get("/api/public/{slug}")
def get_public_quiz(slug: str, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT title, questions_json FROM quizzes WHERE public_slug = ?", (slug,))
    quiz = cursor.fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Тест не найден")

    data = json.loads(quiz["questions_json"])
    return {"title": quiz["title"], "questions": data["questions"]}


@app.post("/api/public/{slug}/submit")
def submit_quiz(slug: str, data: AttemptSubmit, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT id, questions_json FROM quizzes WHERE public_slug = ?", (slug,))
    quiz = cursor.fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Тест не найден")

    questions = json.loads(quiz["questions_json"])["questions"]
    score = 0
    for i, ans_idx in enumerate(data.answers):
        if i < len(questions) and ans_idx == questions[i]["correct_index"]:
            score += 1

    total = len(questions)
    cursor.execute(
        "INSERT INTO attempts (quiz_id, student_name, score, total, answers_json, duration_sec) VALUES (?, ?, ?, ?, ?, ?)",
        (quiz["id"], data.student_name, score, total, json.dumps(data.answers), data.duration_sec)
    )
    db.commit()

    return {"score": score, "total": total, "percentage": round((score / total) * 100)}