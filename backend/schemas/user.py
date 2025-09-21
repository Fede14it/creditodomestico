from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, date
from typing import Optional

class UserCreate(BaseModel):
    # Informazioni di autenticazione
    email: EmailStr
    password: str
    
    # Informazioni personali obbligatorie
    first_name: str
    last_name: str
    phone_number: str
    date_of_birth: date
    address: str
    city: str
    postal_code: str
    country: str = "Italia"
    
    @validator('first_name')
    def validate_first_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Il nome è obbligatorio e deve avere almeno 2 caratteri')
        return v.strip().title()
    
    @validator('last_name')
    def validate_last_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Il cognome è obbligatorio e deve avere almeno 2 caratteri')
        return v.strip().title()
    
    @validator('phone_number')
    def validate_phone(cls, v):
        if not v or len(v.replace(' ', '').replace('+', '').replace('-', '')) < 8:
            raise ValueError('Il numero di telefono è obbligatorio e deve essere valido (minimo 8 cifre)')
        return v
    
    @validator('address')
    def validate_address(cls, v):
        if not v or len(v.strip()) < 5:
            raise ValueError('L\'indirizzo è obbligatorio e deve avere almeno 5 caratteri')
        return v.strip()
    
    @validator('city')
    def validate_city(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('La città è obbligatoria e deve avere almeno 2 caratteri')
        return v.strip().title()
    
    @validator('postal_code')
    def validate_postal_code(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError('Il codice postale è obbligatorio (minimo 3 caratteri)')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La password deve avere almeno 6 caratteri')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone_number: str
    date_of_birth: date
    address: str
    city: str
    postal_code: str
    country: str
    balance: float
    created_at: datetime
    is_verified: bool
    
    # Proprietà calcolate
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    
    class Config:
        from_attributes = True
        
    def __init__(self, **data):
        super().__init__(**data)
        # Calcola i nomi derivati
        if hasattr(self, 'first_name') and hasattr(self, 'last_name'):
            self.full_name = f"{self.first_name} {self.last_name}"
            self.display_name = self.full_name

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Nome e cognome devono avere almeno 2 caratteri')
        return v.strip().title() if v else v 