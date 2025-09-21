import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TransferForm = ({ onTransferSuccess }) => {
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, API_BASE_URL, apiCall } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const transferAmount = parseFloat(amount);
    
    if (transferAmount <= 0) {
      setError('L\'importo deve essere maggiore di zero');
      setLoading(false);
      return;
    }

    if (transferAmount > user.balance) {
      setError('Saldo insufficiente per completare il trasferimento');
      setLoading(false);
      return;
    }

    try {
      const response = await apiCall(`${API_BASE_URL}/transfer`, {
        method: 'POST',
        body: JSON.stringify({
          to_email: toEmail,
          amount: transferAmount,
          description: description || undefined
        }),
      });

      if (response.ok) {
        const transaction = await response.json();
        setSuccess(`Trasferimento di €${transferAmount.toFixed(2)} a ${toEmail} completato con successo!`);
        setToEmail('');
        setAmount('');
        setDescription('');
        
        if (onTransferSuccess) {
          onTransferSuccess(transaction);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Errore durante il trasferimento');
      }
    } catch (error) { 
      console.error('Errore durante il trasferimento:', error);
      setError('Errore di connessione');
    }

    setLoading(false);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="fas fa-exchange-alt me-2"></i>
              Trasferisci Denaro
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
              <div className="col-md-6">
                <div className="card border-primary">
                  <div className="card-body text-center">
                    <h6 className="card-title text-primary">
                      <i className="fas fa-wallet me-1"></i>
                      Saldo Disponibile
                    </h6>
                    <h3 className="text-primary">€{user?.balance?.toFixed(2)}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-info">
                  <div className="card-body text-center">
                    <h6 className="card-title text-info">
                      <i className="fas fa-user me-1"></i>
                      Il tuo Account
                    </h6>
                    <p className="text-muted mb-0">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="toEmail" className="form-label">
                  <i className="fas fa-envelope me-1"></i>
                  Email Destinatario
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="toEmail"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="esempio@email.com"
                  required
                />
                <div className="form-text">
                  Inserisci l'email dell'utente a cui vuoi inviare il denaro
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="amount" className="form-label">
                  <i className="fas fa-euro-sign me-1"></i>
                  Importo
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
                    min="0.01"
                    max={user?.balance}
                    required
                  />
                </div>
                <div className="form-text">
                  Importo massimo: €{user?.balance?.toFixed(2)}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  <i className="fas fa-comment me-1"></i>
                  Descrizione (opzionale)
                </label>
                <textarea
                  className="form-control"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motivo del trasferimento..."
                  rows="3"
                ></textarea>
              </div>

              <div className="d-grid">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Trasferimento in corso...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Conferma Trasferimento
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4">
              <div className="alert alert-info">
                <h6>
                  <i className="fas fa-info-circle me-2"></i>
                  Informazioni importanti
                </h6>
                <ul className="mb-0">
                  <li>I trasferimenti sono istantanei</li>
                  <li>Non puoi trasferire denaro a te stesso</li>
                  <li>L'utente destinatario deve essere registrato</li>
                  <li>Non è possibile annullare un trasferimento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferForm; 