from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_token = Column(String(255), nullable=False)
    card_last4 = Column(String(4), nullable=False)
    card_brand = Column(String(50), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relazioni
    user = relationship("User", back_populates="cards")
    
    def __repr__(self):
        return f"<Card(id={self.id}, last4='{self.card_last4}', brand='{self.card_brand}', default={self.is_default})>" 