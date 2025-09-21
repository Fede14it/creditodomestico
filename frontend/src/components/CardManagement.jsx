import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CardManagement = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { getUserCards, setDefaultCard, deleteCard } = useAuth();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    setError('');
    const result = await getUserCards();
    
    if (result.success) {
      setCards(result.cards);
    } else {
      setError(result.error || 'Errore nel caricamento delle carte');
    }
    setLoading(false);
  };

  const handleSetDefault = async (cardId) => {
    setError('');
    setSuccess('');
    
    const result = await setDefaultCard(cardId);
    
    if (result.success) {
      setSuccess('Carta impostata come predefinita');
      loadCards(); // Ricarica le carte per aggiornare lo stato
    } else {
      setError(result.error || 'Errore nell\'impostazione della carta predefinita');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa carta?')) {
      return;
    }

    setError('');
    setSuccess('');
    
    const result = await deleteCard(cardId);
    
    if (result.success) {
      setSuccess('Carta eliminata con successo');
      loadCards(); // Ricarica le carte per aggiornare lo stato
    } else {
      setError(result.error || 'Errore nell\'eliminazione della carta');
    }
  };

  const getCardBrandIcon = (brand) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'fab fa-cc-visa text-primary';
    if (brandLower.includes('mastercard')) return 'fab fa-cc-mastercard text-warning';
    if (brandLower.includes('american express')) return 'fab fa-cc-amex text-info';
    if (brandLower.includes('discover')) return 'fab fa-cc-discover text-success';
    return 'fas fa-credit-card text-secondary';
  };

  const getCardBrandColor = (brand) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'border-primary';
    if (brandLower.includes('mastercard')) return 'border-warning';
    if (brandLower.includes('american express')) return 'border-info';
    if (brandLower.includes('discover')) return 'border-success';
    return 'border-secondary';
  };

  if (loading) {
    return (
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Gestione Carte
              </h5>
            </div>
            <div className="card-body text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
              <p className="mt-2">Caricamento delle carte...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-10">
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-credit-card me-2"></i>
              Gestione Carte Salvate
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

            {cards.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-credit-card fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Nessuna carta salvata</h5>
                <p className="text-muted">
                  Le carte che salvi durante le ricariche appariranno qui.
                </p>
              </div>
            ) : (
              <div className="row">
                {cards.map((card) => (
                  <div key={card.id} className="col-md-6 col-lg-4 mb-3">
                    <div className={`card h-100 ${getCardBrandColor(card.card_brand)} ${card.is_default ? 'border-success border-3' : ''}`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <i className={`${getCardBrandIcon(card.card_brand)} fa-2x`}></i>
                          </div>
                          {card.is_default && (
                            <span className="badge bg-success">
                              <i className="fas fa-star me-1"></i>
                              Predefinita
                            </span>
                          )}
                        </div>
                        
                        <h6 className="card-title">{card.card_brand}</h6>
                        <p className="card-text">
                          <strong>•••• •••• •••• {card.card_last4}</strong>
                        </p>
                        
                        <small className="text-muted">
                          Aggiunta il {new Date(card.created_at).toLocaleDateString('it-IT')}
                        </small>
                      </div>
                      
                      <div className="card-footer bg-transparent">
                        <div className="d-flex gap-2">
                          {!card.is_default && (
                            <button
                              className="btn btn-outline-primary btn-sm flex-fill"
                              onClick={() => handleSetDefault(card.id)}
                              title="Imposta come predefinita"
                            >
                              <i className="fas fa-star me-1"></i>
                              Predefinita
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteCard(card.id)}
                            title="Elimina carta"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="alert alert-info">
                <h6>
                  <i className="fas fa-info-circle me-2"></i>
                  Informazioni sulle Carte Salvate
                </h6>
                <ul className="mb-0">
                  <li>Le carte vengono salvate in modo sicuro</li>
                  <li>Vengono memorizzate solo le ultime 4 cifre</li>
                  <li>Puoi impostare una carta come predefinita</li>
                  <li>La carta predefinita verrà utilizzata automaticamente</li>
                  <li>Puoi eliminare le carte in qualsiasi momento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardManagement; 