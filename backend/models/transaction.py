from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null per ricariche esterne
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)  # 'transfer', 'recharge'
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(String(255), nullable=True)
    
    # Relazioni
    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="sent_transactions")
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="received_transactions") 