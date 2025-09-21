from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CardBase(BaseModel):
    card_token: str = Field(..., description="Token della carta")
    card_last4: str = Field(..., description="Ultime 4 cifre della carta")
    card_brand: str = Field(..., description="Brand della carta (Visa, Mastercard, etc.)")

class CardCreate(CardBase):
    save_card: bool = Field(False, description="Se salvare la carta per l'utente")

class CardResponse(CardBase):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CardUpdate(BaseModel):
    is_default: Optional[bool] = None

class CardListResponse(BaseModel):
    cards: list[CardResponse]
    total: int 