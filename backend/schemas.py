from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    category_id: int
    amount: float
    description: Optional[str] = None
    transaction_type: str
    date: date


class TransactionOut(BaseModel):
    id: int
    amount: float
    description: Optional[str]
    transaction_type: str
    date: date
    category: CategoryOut

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    category_id: int
    monthly_limit: float
    month: int
    year: int


class BudgetOut(BaseModel):
    id: int
    monthly_limit: float
    month: int
    year: int
    category: CategoryOut

    class Config:
        from_attributes = True
