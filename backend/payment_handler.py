import time
import random
from typing import Dict, Optional

class FakePaymentHandler:
    def __init__(self):
        self.payments = {}
    
    def _validate_card(self, card_token: str) -> bool:
        """
        Valida un token di carta (simulato)
        
        Args:
            card_token: Token della carta da validare
            
        Returns:
            True se la carta è valida, False altrimenti
        """
        # Simula la validazione della carta
        # In un sistema reale, questo verrebbe dal gateway di pagamento
        return len(card_token) > 10 and card_token.startswith('tok_')
    
    def _detect_card_brand(self, card_number: str) -> str:
        """
        Rileva il brand della carta basandosi sul numero
        
        Args:
            card_number: Numero della carta (senza spazi)
            
        Returns:
            Brand della carta (visa, mastercard, amex, discover)
        """
        # Rimuovi spazi e caratteri non numerici
        clean_number = ''.join(filter(str.isdigit, card_number))
        
        # Pattern per rilevare i brand delle carte
        if clean_number.startswith('4'):
            return 'Visa'
        elif clean_number.startswith(('51', '52', '53', '54', '55')):
            return 'Mastercard'
        elif clean_number.startswith(('34', '37')):
            return 'American Express'
        elif clean_number.startswith(('6011', '622', '64', '65')):
            return 'Discover'
        elif clean_number.startswith(('35')):
            return 'JCB'
        elif clean_number.startswith(('36', '38', '39')):
            return 'Diners Club'
        elif clean_number.startswith(('62')):
            return 'UnionPay'
        else:
            return 'Unknown'
    
    def get_card_info(self, card_token: str, card_number: str) -> Optional[Dict]:
        """
        Ottiene informazioni su una carta dal numero (per nuove carte)
        
        Args:
            card_token: Token della carta
            card_number: Numero della carta (obbligatorio per rilevare brand e last4)
            
        Returns:
            Dict con le informazioni della carta o None se non valida
        """
        if not self._validate_card(card_token):
            return None
        
        if not card_number:
            raise ValueError("card_number è obbligatorio per nuove carte")
        
        # Rileva il brand dal numero della carta
        brand = self._detect_card_brand(card_number)
        
        # Genera le ultime 4 cifre dal numero reale
        clean_number = ''.join(filter(str.isdigit, card_number))
        last4 = clean_number[-4:] if len(clean_number) >= 4 else '0000'
        
        return {
            "card_token": card_token,
            "card_last4": last4,
            "card_brand": brand,
            "is_valid": True
        }
    
    def process_payment(self, amount: float, card_token: str, currency: str = "EUR") -> Dict:
        """
        Processa un pagamento (simulato)
        
        Args:
            amount: Importo del pagamento
            card_token: Token della carta
            currency: Valuta (default EUR)
            
        Returns:
            Dict con i dettagli del pagamento
        """
        if not self._validate_card(card_token):
            raise ValueError("Token carta non valido")
        
        if amount <= 0:
            raise ValueError("L'importo deve essere maggiore di zero")
        
        if amount > 10000:
            raise ValueError("L'importo massimo è €10.000")
        
        # Simula il processing del pagamento
        time.sleep(0.5)  # Simula latenza di rete
        
        # Genera un ID di pagamento unico
        payment_id = f"pay_{int(time.time())}_{random.randint(1000, 9999)}"
        
        # Simula un tasso di successo del 95%
        success = random.random() > 0.05
        
        if success:
            payment_status = "succeeded"
            status_message = "Pagamento completato con successo"
        else:
            payment_status = "failed"
            status_message = "Pagamento rifiutato"
        
        # Salva i dettagli del pagamento
        self.payments[payment_id] = {
            "id": payment_id,
            "amount": amount,
            "currency": currency,
            "card_token": card_token,
            "status": payment_status,
            "created_at": time.time(),
            "message": status_message
        }
        
        return {
            "id": payment_id,
            "amount": amount,
            "currency": currency,
            "status": payment_status,
            "message": status_message,
            "created_at": time.time()
        }
    
    def get_payment_status(self, payment_id: str) -> Optional[Dict]:
        """
        Ottiene lo stato di un pagamento
        
        Args:
            payment_id: ID del pagamento
            
        Returns:
            Dict con lo stato del pagamento o None se non trovato
        """
        return self.payments.get(payment_id)
    
    def refund_payment(self, payment_id: str, amount: float = None) -> Dict:
        """
        Rimborsa un pagamento (simulato)
        
        Args:
            payment_id: ID del pagamento da rimborsare
            amount: Importo da rimborsare (se None, rimborsa tutto)
            
        Returns:
            Dict con i dettagli del rimborso
        """
        payment = self.payments.get(payment_id)
        if not payment:
            raise ValueError("Pagamento non trovato")
        
        if payment["status"] != "succeeded":
            raise ValueError("Solo i pagamenti completati possono essere rimborsati")
        
        refund_amount = amount if amount is not None else payment["amount"]
        
        if refund_amount > payment["amount"]:
            raise ValueError("L'importo del rimborso non può superare l'importo del pagamento")
        
        # Simula il processing del rimborso
        time.sleep(0.3)
        
        refund_id = f"ref_{int(time.time())}_{random.randint(1000, 9999)}"
        
        return {
            "id": refund_id,
            "payment_id": payment_id,
            "amount": refund_amount,
            "currency": payment["currency"],
            "status": "succeeded",
            "message": "Rimborso completato con successo",
            "created_at": time.time()
        }

# Istanza globale del payment handler
payment_handler = FakePaymentHandler()