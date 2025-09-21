import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RechargeForm = ({ onRechargeSuccess }) => {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectedBrand, setDetectedBrand] = useState('');
  const { getUserCards, API_BASE_URL, apiCall } = useAuth();

  useEffect(() => {
    loadSavedCards();
  }, []);

  const loadSavedCards = async () => {
    setLoadingCards(true);
    const result = await getUserCards();
    if (result.success) {
      setSavedCards(result.cards);
      // Se c'è una carta predefinita, selezionala automaticamente
      const defaultCard = result.cards.find(card => card.is_default);
      if (defaultCard) {
        setSelectedCard(defaultCard.id.toString());
      } else if (result.cards.length === 0) {
        // Se non ci sono carte salvate, seleziona automaticamente "nuova carta"
        setSelectedCard('new');
      }
    } else if (result.cards.length === 0) {
      // Se non ci sono carte salvate, seleziona automaticamente "nuova carta"
      setSelectedCard('new');
    }
    setLoadingCards(false);
  };

  const detectCardBrand = (cardNumber) => {
    // Rimuovi spazi e caratteri non numerici
    const cleanNumber = cardNumber.replace(/\s/g, '').replace(/\D/g, '');
    
    // Pattern per rilevare i brand delle carte
    if (cleanNumber.startsWith('4')) {
      return 'Visa';
    } else if (cleanNumber.startsWith('51') || cleanNumber.startsWith('52') || 
               cleanNumber.startsWith('53') || cleanNumber.startsWith('54') || 
               cleanNumber.startsWith('55')) {
      return 'Mastercard';
    } else if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) {
      return 'American Express';
    } else if (cleanNumber.startsWith('6011') || cleanNumber.startsWith('622') || 
               cleanNumber.startsWith('64') || cleanNumber.startsWith('65')) {
      return 'Discover';
    } else if (cleanNumber.startsWith('35')) {
      return 'JCB';
    } else if (cleanNumber.startsWith('36') || cleanNumber.startsWith('38') || 
               cleanNumber.startsWith('39')) {
      return 'Diners Club';
    } else if (cleanNumber.startsWith('62')) {
      return 'UnionPay';
    } else if (cleanNumber.length >= 4) {
      return 'Unknown';
    }
    
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const rechargeAmount = parseFloat(amount);
    
    if (rechargeAmount <= 0) {
      setError('L\'importo deve essere maggiore di zero');
      setLoading(false);
      return;
    }

    if (rechargeAmount > 10000) {
      setError('L\'importo massimo per ricarica è €10.000');
      setLoading(false);
      return;
    }

    // Validazione in base al tipo di carta selezionata
    if (selectedCard === 'new') {
      // Validazione per nuova carta
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        setError('Tutti i campi della carta sono obbligatori');
        setLoading(false);
        return;
      }
    } else if (!selectedCard) {
      setError('Seleziona una carta');
      setLoading(false);
      return;
    }

    try {
      let cardToken;
      let cardData = null;
      
      if (selectedCard === 'new') {
        // Genera un nuovo token per la nuova carta
        cardToken = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Invia i dati reali della carta per il salvataggio
        cardData = {
          card_number: cardNumber,
          expiry_date: expiryDate,
          cvv: cvv,
          cardholder_name: cardholderName
        };
      } else {
        // Usa la carta salvata selezionata
        const selectedCardData = savedCards.find(card => card.id.toString() === selectedCard);
        if (!selectedCardData) {
          setError('Carta non trovata');
          setLoading(false);
          return;
        }
        cardToken = selectedCardData.card_token;
      }

      const response = await apiCall(`${API_BASE_URL}/recharge`, {
        method: 'POST',
        body: JSON.stringify({
          amount: rechargeAmount,
          card_token: cardToken,
          save_card: saveCard && selectedCard === 'new', // Salva solo se è una nuova carta
          ...(cardData && { card_data: cardData }) // Invia i dati della carta solo se esistono
        }),
      });

      if (response.ok) {
        const transaction = await response.json();
        const successMessage = `Ricarica di €${rechargeAmount.toFixed(2)} completata con successo!`;
        const saveMessage = saveCard && selectedCard === 'new' ? ' Carta salvata per futuri utilizzi.' : '';
        setSuccess(successMessage + saveMessage);
        
        // Reset form
        setAmount('');
        if (selectedCard === 'new') {
          setCardNumber('');
          setExpiryDate('');
          setCvv('');
          setCardholderName('');
          setSaveCard(false);
          setDetectedBrand('');
        }
        
        // Ricarica le carte salvate per aggiornare la lista
        loadSavedCards();
        
        if (onRechargeSuccess) {
          onRechargeSuccess(transaction);
        }
      } else {
        const errorData = await response.json();
        
        // Gestisce diversi tipi di errori
        let errorMessage = 'Errore durante la ricarica';
        
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Errori di validazione Pydantic
            errorMessage = errorData.detail.map(err => err.msg).join(', ');
          } else {
            // Errore semplice
            errorMessage = errorData.detail;
          }
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Errore durante la ricarica:', error);
      setError('Errore di connessione');
    }

    setLoading(false);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
    
    // Rileva il brand della carta
    const brand = detectCardBrand(formattedValue);
    setDetectedBrand(brand);
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardBrandIcon = (brand) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'fab fa-cc-visa text-primary';
    if (brandLower.includes('mastercard')) return 'fab fa-cc-mastercard text-warning';
    if (brandLower.includes('american express')) return 'fab fa-cc-amex text-info';
    if (brandLower.includes('discover')) return 'fab fa-cc-discover text-success';
    if (brandLower.includes('jcb')) return 'fab fa-cc-jcb text-danger';
    if (brandLower.includes('diners club')) return 'fab fa-cc-diners-club text-secondary';
    return 'fas fa-credit-card text-secondary';
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="fas fa-credit-card me-2"></i>
              Ricarica Account
            </h5>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {success}
              </div>
            )}

            <div className="row mb-4">
              <div className="col-md-12">
                <div className="card border-success">
                  <div className="card-body text-center">
                    <h6 className="card-title text-success">
                      <i className="fas fa-plus-circle me-1"></i>
                      Importo Ricarica
                    </h6>
                    <h3 className="text-success">€{amount || '0.00'}</h3>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="amount" className="form-label">
                  <i className="fas fa-euro-sign me-1"></i>
                  Importo da Ricaricare
                </label>
                <div className="input-group">
                  <span className="input-group-text">€</span>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="1.00"
                    max="10000.00"
                    required
                  />
                </div>
                <div className="form-text">
                  Importo minimo: €1.00 - Importo massimo: €10.000.00
                </div>
              </div>

              <hr className="my-4" />

              <h6 className="mb-3">
                <i className="fas fa-credit-card me-2"></i>
                Selezione Carta
              </h6>

              {/* Selezione carta con opzione per nuova carta */}
              <div className="mb-3">
                <label htmlFor="cardSelect" className="form-label">
                  Seleziona Carta
                </label>
                {loadingCards ? (
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    <span>Caricamento carte...</span>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    id="cardSelect"
                    value={selectedCard}
                    onChange={(e) => setSelectedCard(e.target.value)}
                    required
                  >
                    <option value="">Seleziona una carta...</option>
                    {savedCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.card_brand} •••• {card.card_last4}
                        {card.is_default ? ' (Predefinita)' : ''}
                      </option>
                    ))}
                    <option value="new" className="text-primary">
                      ➕ Aggiungi una nuova carta
                    </option>
                  </select>
                )}
              </div>

              {/* Form per nuova carta */}
              {selectedCard === 'new' && (
                <>
                  <div className="mb-3">
                    <label htmlFor="cardNumber" className="form-label">
                      Numero Carta
                      {detectedBrand && (
                        <span className="ms-2">
                          <i className={getCardBrandIcon(detectedBrand)}></i>
                          <small className="text-muted ms-1">{detectedBrand}</small>
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="cardNumber"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="expiryDate" className="form-label">Data Scadenza</label>
                        <input
                          type="text"
                          className="form-control"
                          id="expiryDate"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="cvv" className="form-label">CVV</label>
                        <input
                          type="text"
                          className="form-control"
                          id="cvv"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="cardholderName" className="form-label">Intestatario Carta</label>
                    <input
                      type="text"
                      className="form-control"
                      id="cardholderName"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="NOME COGNOME"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="saveCard"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="saveCard">
                        <i className="fas fa-save me-1"></i>
                        Salva questa carta per futuri utilizzi
                      </label>
                    </div>
                    <div className="form-text">
                      La carta verrà salvata in modo sicuro per ricariche future
                    </div>
                  </div>
                </>
              )}

              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Elaborazione pagamento...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock me-2"></i>
                      Conferma Ricarica
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4">
              <div className="alert alert-warning">
                <h6>
                  <i className="fas fa-info-circle me-2"></i>
                  Informazioni sulla Sicurezza
                </h6>
                <ul className="mb-0">
                  <li>I dati della carta sono protetti con crittografia SSL</li>
                  <li>Non memorizziamo i dati completi della carta</li>
                  <li>Le transazioni sono simulate per questo progetto</li>
                  <li>In produzione, utilizzeremmo Stripe per i pagamenti reali</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RechargeForm; 