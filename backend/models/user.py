from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Informazioni di autenticazione
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Informazioni personali
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    
    # Indirizzo
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(100), nullable=False, default="Italia")
    
    # Informazioni finanziarie
    balance = Column(Float, default=1000.0)
    
    # Metadati
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Relazioni
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.from_user_id", back_populates="from_user")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.to_user_id", back_populates="to_user")
    cards = relationship("Card", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def full_name(self):
        """Restituisce il nome completo dell'utente"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self):
        """Nome da mostrare nell'interfaccia"""
        return self.full_name if self.first_name else self.email 