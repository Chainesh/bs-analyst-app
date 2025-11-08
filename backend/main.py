# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
from datetime import datetime
import io
import os
import pdfplumber
from google.generativeai import GenerativeModel
from dotenv import load_dotenv
import os
import google.generativeai as genai

from dotenv import load_dotenv
import os
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get and configure API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Debug: Check if key is loaded
if GEMINI_API_KEY:
    print(f"✓ Gemini API key loaded: {GEMINI_API_KEY[:10]}...")
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("✗ WARNING: GEMINI_API_KEY not found in environment!")
    print("  Create a .env file with: GEMINI_API_KEY=your_key_here")


from db import (
    Base,
    engine,
    SessionLocal,
    User,
    Company,
    UserCompanyAccess,
    Document,
    DocumentChunk,
)

app = FastAPI(title="Balance Sheet Analyst API")

# create tables
Base.metadata.create_all(bind=engine)

# Also add a health check endpoint to verify:
@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": GEMINI_API_KEY is not None,
        "gemini_key_preview": GEMINI_API_KEY[:10] + "..." if GEMINI_API_KEY else None
    }

# allow React (Vite runs on 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------
# AUTH / USERS
# ------------------
@app.post("/seed/admin")
def seed_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        return {"message": "admin already exists", "id": existing.id}
    user = User(username="admin", password="admin", role="group_admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "admin created", "id": user.id}


@app.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.username == username, User.password == password)
        .first()
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # super-simple token
    token = f"user-{user.id}"
    return {"token": token, "role": user.role, "user_id": user.id}


def get_current_user(
    x_token: str = Header(..., alias="X-Token"),
    db: Session = Depends(get_db),
):
    """
    Token format: user-<id>
    """
    if not x_token.startswith("user-"):
        raise HTTPException(status_code=401, detail="Bad token format")
    try:
        user_id = int(x_token.split("-")[1])
    except ValueError:
        raise HTTPException(status_code=401, detail="Bad token format")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user


def user_has_company_access(user: User, company_id: int, db: Session) -> bool:
    # group_admin can see everything
    if user.role == "group_admin":
        return True
    # otherwise check mapping
    row = (
        db.query(UserCompanyAccess)
        .filter(
            UserCompanyAccess.user_id == user.id,
            UserCompanyAccess.company_id == company_id,
        )
        .first()
    )
    return row is not None


# ------------------
# USER MANAGEMENT (NEW)
# ------------------
@app.post("/users")
def create_user(
    username: str,
    password: str,
    role: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # only admin can create users
    if current.role != "group_admin":
        raise HTTPException(status_code=403, detail="Only admin can create users")
    
    if role not in ["group_admin", "analyst", "ceo"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = User(username=username, password=password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@app.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # only admin can list users
    if current.role != "group_admin":
        raise HTTPException(status_code=403, detail="Only admin can list users")
    
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]


# ------------------
# COMPANIES
# ------------------
@app.post("/companies")
def create_company(
    name: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # only group_admin can create companies
    if user.role != "group_admin":
        raise HTTPException(status_code=403, detail="Only admin can create companies")

    existing = db.query(Company).filter(Company.name == name).first()
    if existing:
        return {"id": existing.id, "name": existing.name, "message": "already exists"}

    c = Company(name=name)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "message": "created"}


@app.get("/companies")
def list_companies(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # group_admin sees all
    if user.role == "group_admin":
        rows = db.query(Company).all()
        return [{"id": r.id, "name": r.name} for r in rows]

    # others: list only companies they have access to
    rows = (
        db.query(Company)
        .join(UserCompanyAccess, UserCompanyAccess.company_id == Company.id)
        .filter(UserCompanyAccess.user_id == user.id)
        .all()
    )
    return [{"id": r.id, "name": r.name} for r in rows]


@app.post("/grant-access")
def grant_access(
    user_id: int,
    company_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # only admin can grant
    if current.role != "group_admin":
        raise HTTPException(status_code=403, detail="Only admin can grant access")

    existing = (
        db.query(UserCompanyAccess)
        .filter(
            UserCompanyAccess.user_id == user_id,
            UserCompanyAccess.company_id == company_id,
        )
        .first()
    )
    if existing:
        return {"message": "already has access"}

    uca = UserCompanyAccess(user_id=user_id, company_id=company_id)
    db.add(uca)
    db.commit()
    return {"message": "granted"}


# ------------------
# DOCUMENT MANAGEMENT (NEW)
# ------------------
@app.get("/documents")
def list_documents(
    company_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # access check
    if not user_has_company_access(user, company_id, db):
        raise HTTPException(status_code=403, detail="Not allowed for this company")
    
    docs = db.query(Document).filter(Document.company_id == company_id).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "size_kb": d.size_kb,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in docs
    ]


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # access check
    if not user_has_company_access(user, doc.company_id, db):
        raise HTTPException(status_code=403, detail="Not allowed for this company")
    
    # delete chunks first
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.delete(doc)
    db.commit()
    return {"message": "deleted"}


# ------------------
# PDF INGEST
# ------------------
def extract_pdf_text(raw_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text() or ""
            text_parts.append(t)
    return "\n".join(text_parts)


def chunk_text(text: str, max_chars: int = 900) -> list[str]:
    chunks = []
    text = text.strip()
    for i in range(0, len(text), max_chars):
        part = text[i : i + max_chars].strip()
        if part:
            chunks.append(part)
    return chunks


@app.post("/ingest-pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    company_id: int = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # access check
    if not user_has_company_access(user, company_id, db):
        raise HTTPException(status_code=403, detail="Not allowed for this company")

    content = await file.read()
    size_kb = round(len(content) / 1024)

    doc = Document(
        company_id=company_id,
        filename=file.filename,
        content_type=file.content_type,
        size_kb=size_kb,
        created_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    full_text = extract_pdf_text(content)
    chunks = chunk_text(full_text, max_chars=900)

    for idx, ch in enumerate(chunks):
        db_chunk = DocumentChunk(
            document_id=doc.id,
            company_id=company_id,
            chunk_index=idx,
            text=ch,
            created_at=datetime.utcnow(),
        )
        db.add(db_chunk)
    db.commit()

    return {
        "message": "uploaded and chunked",
        "document_id": doc.id,
        "company_id": company_id,
        "num_chunks": len(chunks),
    }


# ------------------
# ASK (no paid LLM)
# ------------------
def redact_other_companies(db: Session, allowed_company_id: int, text: str) -> str:
    """
    Responsible-AI-ish step:
    - get all company names
    - remove/mask names that are not the selected company
    """
    companies = db.query(Company).all()
    # get the allowed name
    allowed_name = None
    for c in companies:
        if c.id == allowed_company_id:
            allowed_name = c.name
            break

    redacted = text
    for c in companies:
        if c.id == allowed_company_id:
            continue
        # case insensitive replace
        if c.name:
            redacted = redacted.replace(c.name, "[REDACTED]")
            # also lower-case version
            redacted = redacted.replace(c.name.lower(), "[REDACTED]")
    return redacted


def call_gemini_with_context(question: str, context: str) -> dict:
    """
    Uses Google Gemini to generate a final answer from retrieved context.
    Returns dict with 'answer' and optional 'error'
    """
    try:
        if not GEMINI_API_KEY:
            return {
                "error": "Gemini API key not configured",
                "answer": None
            }
        
        # Try different model names in order of preference
        model_names = [
            "models/gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-1.0-pro",
        ]
        
        model = None
        used_model = None
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                used_model = model_name
                break
            except Exception as e:
                print(f"Failed to load {model_name}: {e}")
                continue
        
        if not model:
            return {
                "error": "No available Gemini models found",
                "answer": None
            }
        
        prompt = f"""You are a financial analysis assistant.

Use ONLY the context below to answer the user's question.
If the answer is not clearly present, say: "Information not available in the provided documents."

Context:
{context}

Question: {question}

Answer:"""
        
        # Generate content with timeout and error handling
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=800,
                temperature=0.2,
            )
        )
        
        return {
            "answer": response.text,
            "error": None,
            "model_used": used_model
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini error: {error_msg}")
        return {
            "error": error_msg,
            "answer": None
        }

# Update the /ask endpoint to use the new response format:
@app.post("/ask")
def ask(
    question: str,
    company_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1) access check
    if not user_has_company_access(user, company_id, db):
        raise HTTPException(status_code=403, detail="Not allowed for this company")

    # 2) MySQL FULLTEXT search
    sql = sql_text(
        """
        SELECT id, text
        FROM document_chunks
        WHERE company_id = :company_id
          AND MATCH(text) AGAINST (:q IN NATURAL LANGUAGE MODE)
        ORDER BY MATCH(text) AGAINST (:q IN NATURAL LANGUAGE MODE) DESC
        LIMIT 8;
        """
    )
    rows = db.execute(sql, {"company_id": company_id, "q": question}).fetchall()

    if not rows:
        # fallback to latest chunks
        fallback = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.company_id == company_id)
            .order_by(DocumentChunk.created_at.desc())
            .limit(5)
            .all()
        )
        if not fallback:
            raise HTTPException(status_code=404, detail="No chunks for this company")
        context = "\n\n---\n\n".join([f.text for f in fallback])
        chunks_used = len(fallback)
    else:
        context = "\n\n---\n\n".join([r.text for r in rows])
        chunks_used = len(rows)

    # 3) Responsible AI: redact other company names
    context = redact_other_companies(db, company_id, context)

    # 4) Try Gemini
    gemini_result = call_gemini_with_context(question, context)
    
    if gemini_result.get("answer"):
        return {
            "answer": gemini_result["answer"],
            "context": context,
            "chunks_used": chunks_used,
            "llm": gemini_result.get("model_used", "gemini"),
        }
    
    # 5) Fallback
    return {
        "answer": f"Here are the most relevant sections for: '{question}'",
        "context": context,
        "chunks_used": chunks_used,
        "llm": "none",
        "error": gemini_result.get("error")
    }

# Add this endpoint to backend/main.py to diagnose Gemini issues

@app.get("/gemini-status")
def gemini_status():
    """
    Diagnostic endpoint to check Gemini API status and available models
    """
    if not GEMINI_API_KEY:
        return {
            "configured": False,
            "error": "GEMINI_API_KEY environment variable not set",
            "models": []
        }
    
    try:
        # List available models
        available_models = []
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                available_models.append({
                    "name": model.name,
                    "display_name": model.display_name,
                    "description": model.description[:100] if model.description else ""
                })
        
        return {
            "configured": True,
            "api_key_preview": GEMINI_API_KEY[:10] + "..." if GEMINI_API_KEY else None,
            "available_models": available_models,
            "recommended_model": available_models[0]["name"] if available_models else None
        }
    except Exception as e:
        return {
            "configured": True,
            "error": str(e),
            "models": []
        }

# Update the health endpoint too:
@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_configured": GEMINI_API_KEY is not None,
    }