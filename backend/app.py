from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging

# Import delle configurazioni e utilities
from config import CORS_ORIGINS
from database import get_db, engine, Base
from auth import get_current_user, hash_password, verify_password, create_access_token, check_refresh_token
from models import User, Transaction, Card
from schemas import (
    UserCreate, UserLogin, UserResponse, UserUpdate,
    TransferRequest, RechargeRequest, TransactionResponse, CardData,
    CardCreate, CardResponse, CardUpdate, CardListResponse
)
from payment_handler import payment_handler

app = FastAPI(title="CreditoDomestico API", version="1.0.0")

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Exception handler per errori di validazione (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler personalizzato per errori di validazione 422
    """
    logger.error(f"Errore di validazione su {request.url}: {exc.errors()}")
    
    # Formatta gli errori in modo più leggibile
    formatted_errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        formatted_errors.append({
            "field": field,
            "message": message,
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": formatted_errors,
            "message": "Errore di validazione dei dati",
            "errors_count": len(formatted_errors)
        }
    )

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Middleware per sliding session
@app.middleware("http")
async def sliding_session_middleware(request, call_next):
    """Middleware per gestire il refresh automatico del token"""
    response = await call_next(request)
    
    # Controlla se c'è un token nell'header Authorization
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        
        if check_refresh_token(token):
            try:
                from auth import verify_token
                email = verify_token(token)
                new_token = create_access_token(data={"sub": email})
                response.headers["X-New-Token"] = new_token
            except:
                pass
    
    return response

# Crea le tabelle
Base.metadata.create_all(bind=engine)

@app.post("/register", response_model=dict)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Registrazione di un nuovo utente con informazioni complete"""
    logger.info(f"Tentativo di registrazione per email: {user_data.email}")
    
    # Verifica se l'utente esiste già
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        logger.warning(f"Tentativo di registrazione con email già esistente: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )
    
    # Crea il nuovo utente con tutte le informazioni
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        date_of_birth=user_data.date_of_birth,
        address=user_data.address,
        city=user_data.city,
        postal_code=user_data.postal_code,
        country=user_data.country
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Crea il token di accesso
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "full_name": new_user.full_name,
            "balance": new_user.balance,
            "created_at": new_user.created_at,
            "is_verified": new_user.is_verified
        }
    }

@app.post("/login", response_model=dict)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login dell'utente"""
    # Trova l'utente
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti"
        )
    
    # Crea il token di accesso
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "balance": user.balance,
            "created_at": user.created_at
        }
    }

@app.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Ottiene le informazioni dell'utente corrente"""
    return current_user

@app.put("/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggiorna il profilo dell'utente corrente"""
    # Aggiorna solo i campi forniti
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Aggiorna il timestamp
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@app.post("/refresh-token")
def refresh_token(current_user: User = Depends(get_current_user)):
    """Rinnova il token JWT (sliding session)"""
    new_token = create_access_token(data={"sub": current_user.email})
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "message": "Token rinnovato con successo"
    }

@app.post("/transfer", response_model=TransactionResponse)
def transfer_money(
    transfer_data: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trasferimento di denaro tra utenti"""
    # Inizia una transazione atomica
    try:
        # Verifica saldo sufficiente
        if current_user.balance < transfer_data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Saldo insufficiente"
            )
        
        # Trova l'utente destinatario con lock per prevenire race conditions
        recipient = db.query(User).filter(User.email == transfer_data.to_email).with_for_update().first()
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utente destinatario non trovato"
            )
        
        if recipient.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Non puoi trasferire denaro a te stesso"
            )
        
        # Ricarica l'utente corrente con lock per prevenire race conditions
        current_user_locked = db.query(User).filter(User.id == current_user.id).with_for_update().first()
        
        # Verifica nuovamente il saldo dopo il lock (potrebbero esserci stati altri trasferimenti)
        if current_user_locked.balance < transfer_data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Saldo insufficiente"
            )
        
        # Operazioni atomiche: aggiorna i saldi
        current_user_locked.balance -= transfer_data.amount
        recipient.balance += transfer_data.amount
        
        # Crea la transazione
        transaction = Transaction(
            from_user_id=current_user.id,
            to_user_id=recipient.id,
            amount=transfer_data.amount,
            transaction_type="transfer",
            description=transfer_data.description or f"Trasferimento a {recipient.email}"
        )
        
        db.add(transaction)
        
        # Commit atomico - tutto o niente
        db.commit()
        db.refresh(transaction)
        
        return transaction
        
    except HTTPException:
        # Re-raise delle HTTPException per mantenere i codici di errore
        db.rollback()
        raise
    except Exception as e:
        # Rollback in caso di errore
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante il trasferimento"
        )

@app.post("/recharge", response_model=TransactionResponse)
def recharge_balance(
    recharge_data: RechargeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ricarica del saldo tramite carta (simulato)"""
    # Usa il gestore fake per processare il pagamento
    payment_result = payment_handler.process_payment(
        amount=recharge_data.amount,
        card_token=recharge_data.card_token
    )
    
    if payment_result["status"] != "succeeded":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=payment_result.get("message", "Errore durante il pagamento")
        )
    
    # Inizia una transazione atomica per il database
    try:
        # Ricarica l'utente con lock per prevenire race conditions
        current_user_locked = db.query(User).filter(User.id == current_user.id).with_for_update().first()
        
        # Se richiesto, salva la carta (solo per nuove carte)
        if recharge_data.save_card and recharge_data.card_data:
            # Estrai brand e last4 dal numero della carta per salvare nel DB
            card_info = payment_handler.get_card_info(
                recharge_data.card_token, 
                recharge_data.card_data.card_number
            )
            if card_info:
                # Verifica se la carta è già salvata
                existing_card = db.query(Card).filter(
                    Card.user_id == current_user.id,
                    Card.card_token == recharge_data.card_token
                ).first()
                
                if not existing_card:
                    # Se è la prima carta, rendila predefinita
                    is_default = db.query(Card).filter(Card.user_id == current_user.id).count() == 0
                    
                    new_card = Card(
                        user_id=current_user.id,
                        card_token=card_info["card_token"],
                        card_last4=card_info["card_last4"],
                        card_brand=card_info["card_brand"],
                        is_default=is_default
                    )
                    db.add(new_card)
        
        # Operazioni atomiche: aggiorna il saldo
        current_user_locked.balance += recharge_data.amount
        
        # Crea la transazione
        transaction = Transaction(
            from_user_id=None,  # Ricarica esterna
            to_user_id=current_user.id,
            amount=recharge_data.amount,
            transaction_type="recharge",
            description=f"Ricarica tramite carta (ID: {payment_result['id']})"
        )
        
        db.add(transaction)
        
        # Commit atomico - tutto o niente
        db.commit()
        db.refresh(transaction)
        
        return transaction
        
    except Exception as e:
        # Rollback in caso di errore
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante la ricarica"
        )

@app.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottiene la cronologia delle transazioni dell'utente"""
    transactions = db.query(Transaction).filter(
        (Transaction.from_user_id == current_user.id) |
        (Transaction.to_user_id == current_user.id)
    ).order_by(Transaction.created_at.desc()).all()
    
    return transactions

@app.get("/cards", response_model=CardListResponse)
def get_user_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ottiene le carte salvate dell'utente"""
    cards = db.query(Card).filter(Card.user_id == current_user.id).order_by(Card.is_default.desc(), Card.created_at.desc()).all()
    
    return {
        "cards": cards,
        "total": len(cards)
    }

@app.put("/cards/{card_id}/default")
def set_default_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Imposta una carta come predefinita"""
    # Trova la carta
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carta non trovata"
        )
    
    # Rimuovi il flag predefinito da tutte le carte dell'utente
    db.query(Card).filter(Card.user_id == current_user.id).update({"is_default": False})
    
    # Imposta la carta selezionata come predefinita
    card.is_default = True
    
    db.commit()
    db.refresh(card)
    
    return {"message": "Carta impostata come predefinita", "card": card}

@app.delete("/cards/{card_id}")
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Elimina una carta salvata"""
    # Trova la carta
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carta non trovata"
        )
    
    # Se è la carta predefinita, imposta la prima carta rimanente come predefinita
    if card.is_default:
        remaining_cards = db.query(Card).filter(
            Card.user_id == current_user.id,
            Card.id != card_id
        ).order_by(Card.created_at.asc()).first()
        
        if remaining_cards:
            remaining_cards.is_default = True
    
    # Elimina la carta
    db.delete(card)
    db.commit()
    
    return {"message": "Carta eliminata con successo"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run(app, host=HOST, port=PORT)