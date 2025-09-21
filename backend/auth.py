import bcrypt

import jwt

from datetime import datetime, timedelta

from fastapi import HTTPException, Depends, status

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from database import get_db

from models.user import User

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


security = HTTPBearer()


def hash_password(password: str) -> str:

    """Hash della password usando bcrypt"""

    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:

    """Verifica della password hashata"""

    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict):

    """Crea un JWT token"""

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt

def check_refresh_token(token: str) -> bool:

    """Controlla se il token dovrebbe essere rinnovato (sliding session)"""

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        issued_at = datetime.fromtimestamp(payload.get("iat", 0))

        expires_at = datetime.fromtimestamp(payload.get("exp", 0))

        now = datetime.utcnow()
        

        # Rinnova se è passato più del 50% del tempo di vita del token

        token_lifetime = expires_at - issued_at

        refresh_threshold = issued_at + (token_lifetime * 0.5)
        

        return now > refresh_threshold

    except jwt.PyJWTError:

        return False


def verify_token(token: str):

    """Verifica un JWT token"""

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email: str = payload.get("sub")

        if email is None:

            raise HTTPException(

                status_code=status.HTTP_401_UNAUTHORIZED,

                detail="Token non valido",

                headers={"WWW-Authenticate": "Bearer"},
            )
        return email

    except jwt.PyJWTError:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Token non valido",

            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):

    """Dependency per ottenere l'utente corrente dal token"""

    email = verify_token(credentials.credentials)

    user = db.query(User).filter(User.email == email).first()

    if user is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Utente non trovato",

            headers={"WWW-Authenticate": "Bearer"},
        )
    return user 