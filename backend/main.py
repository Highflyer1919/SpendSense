import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from groq import Groq
import json

import models
import schemas
import auth
from database import engine, get_db, Base

load_dotenv()

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SpendSense API")

# Allow React frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Seed default categories on first run ─────────────────────────────────────

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining",    "icon": "🍽️"},
    {"name": "Transport",        "icon": "🚗"},
    {"name": "Shopping",         "icon": "🛍️"},
    {"name": "Entertainment",    "icon": "🎬"},
    {"name": "Health",           "icon": "🏥"},
    {"name": "Education",        "icon": "📚"},
    {"name": "Utilities",        "icon": "💡"},
    {"name": "Rent",             "icon": "🏠"},
    {"name": "Salary",           "icon": "💼"},
    {"name": "Other",            "icon": "💰"},
]


@app.on_event("startup")
def seed_categories():
    db = next(get_db())
    for cat in DEFAULT_CATEGORIES:
        exists = db.query(models.Category).filter(
            models.Category.name == cat["name"]
        ).first()
        if not exists:
            db.add(models.Category(**cat))
    db.commit()
    db.close()


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == form.username
    ).first()
    if not user or not auth.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ── Category routes ───────────────────────────────────────────────────────────

@app.get("/categories", response_model=list[schemas.CategoryOut])
def get_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Category).all()


# ── Transaction routes ────────────────────────────────────────────────────────

@app.post("/transactions", response_model=schemas.TransactionOut)
def create_transaction(
    t: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    transaction = models.Transaction(**t.model_dump(), user_id=current_user.id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.get("/transactions", response_model=list[schemas.TransactionOut])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.date.desc()).all()


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    t = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(t)
    db.commit()
    return {"message": "Deleted"}


# ── Budget routes ─────────────────────────────────────────────────────────────

@app.post("/budgets", response_model=schemas.BudgetOut)
def create_budget(
    b: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    budget = models.Budget(**b.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@app.get("/budgets", response_model=list[schemas.BudgetOut])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id
    ).all()


# ── AI Insights route ─────────────────────────────────────────────────────────

@app.get("/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).all()

    if not transactions:
        return {"insights": "Add some transactions first to get AI insights."}

    # Build a summary for the LLM
    summary = []
    for t in transactions:
        summary.append(
            f"{t.date} | {t.transaction_type.upper()} | "
            f"{t.category.name} | ₹{t.amount} | {t.description or 'No description'}"
        )

    prompt = f"""You are a personal finance advisor. Analyse the following transaction 
history and provide 3-4 specific, actionable insights about spending patterns, 
areas to save money, and budget recommendations. Be concise and practical.

Transaction History:
{chr(10).join(summary)}

Provide your analysis in clear bullet points:"""

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    return {"insights": response.choices[0].message.content}