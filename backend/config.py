import os
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

# Configurazione del database
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://creditodomestico:password@localhost/creditodomestico")

# Configurazione JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configurazione server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Configurazione CORS
CORS_ORIGINS = ["*"]