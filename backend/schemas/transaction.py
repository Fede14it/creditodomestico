from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class TransferRequest(BaseModel):
    to_email: EmailStr
    amount: float
    description: Optional[str] = None

class CardData(BaseModel):
    card_number: str = Field(..., description="Numero della carta")
    expiry_date: str = Field(..., description="Data di scadenza (MM/YY)")
    cvv: str = Field(..., description="Codice CVV")
    cardholder_name: str = Field(..., description="Nome intestatario")

class RechargeRequest(BaseModel):
    amount: float
    card_token: str  # Simulato
    save_card: bool = Field(False, description="Se salvare la carta per l'utente")
    card_data: Optional[CardData] = Field(None, description="Dati della carta per nuove carte")

class TransactionResponse(BaseModel):
    id: int
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    amount: float
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True 