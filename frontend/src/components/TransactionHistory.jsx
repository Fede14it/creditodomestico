import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TransactionHistory = ({ transactions }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'transfer':
        return 'fas fa-exchange-alt text-info';
      case 'recharge':
        return 'fas fa-credit-card text-success';
      default:
        return 'fas fa-question-circle text-secondary';
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'transfer':
        return 'Trasferimento';
      case 'recharge':
        return 'Ricarica';
      default:
        return 'Sconosciuto';
    }
  };

  const getTransactionDirection = (transaction) => {
    if (transaction.transaction_type === 'recharge') {
      return 'incoming';
    }
    return transaction.from_user_id === user?.id ? 'outgoing' : 'incoming';
  };

  const getTransactionAmount = (transaction) => {
    const direction = getTransactionDirection(transaction);
    return direction === 'outgoing' ? -transaction.amount : transaction.amount;
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.transaction_type === 'recharge') {
      return 'Ricarica tramite carta';
    }
    
    if (transaction.from_user_id === user?.id) {
      return `Trasferimento a utente (ID: ${transaction.to_user_id})`;
    } else {
      return `Ricevuto da utente (ID: ${transaction.from_user_id})`;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'incoming') return getTransactionDirection(transaction) === 'incoming';
    if (filter === 'outgoing') return getTransactionDirection(transaction) === 'outgoing';
    if (filter === 'transfers') return transaction.transaction_type === 'transfer';
    if (filter === 'recharges') return transaction.transaction_type === 'recharge';
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-6">
          <h5>
            <i className="fas fa-history me-2"></i>
            Storico Transazioni
          </h5>
          <p className="text-muted">
            Visualizza tutte le tue transazioni recenti
          </p>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-end">
            <select
              className="form-select w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tutte le transazioni</option>
              <option value="incoming">Solo entrate</option>
              <option value="outgoing">Solo uscite</option>
              <option value="transfers">Solo trasferimenti</option>
              <option value="recharges">Solo ricariche</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">Nessuna transazione trovata</h5>
          <p className="text-muted">
            {filter === 'all' 
              ? 'Non hai ancora effettuato nessuna transazione.'
              : `Nessuna transazione trovata per il filtro "${filter}".`
            }
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrizione</th>
                <th>Importo</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const direction = getTransactionDirection(transaction);
                const amount = getTransactionAmount(transaction);
                const isPositive = amount > 0;

                return (
                  <tr key={transaction.id}>
                    <td>
                      <div className="d-flex flex-column">
                        <small className="text-muted">
                          {formatDate(transaction.created_at)}
                        </small>
                        <small className="text-muted">
                          ID: {transaction.id}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <i className={`${getTransactionTypeIcon(transaction.transaction_type)} me-2`}></i>
                        <span>{getTransactionTypeLabel(transaction.transaction_type)}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{transaction.description || getTransactionDescription(transaction)}</div>
                        {transaction.transaction_type === 'transfer' && (
                          <small className="text-muted">
                            {direction === 'outgoing' ? 'Inviato' : 'Ricevuto'}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`fw-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}€{Math.abs(amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${direction === 'incoming' ? 'bg-success' : 'bg-info'}`}>
                        <i className={`fas fa-arrow-${direction === 'incoming' ? 'down' : 'up'} me-1`}></i>
                        {direction === 'incoming' ? 'Entrata' : 'Uscita'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistiche */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body text-center">
              <h6 className="card-title text-primary">Totale Transazioni</h6>
              <h4 className="text-primary">{transactions.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-success">
            <div className="card-body text-center">
              <h6 className="card-title text-success">Entrate Totali</h6>
              <h4 className="text-success">
                €{transactions
                  .filter(t => getTransactionDirection(t) === 'incoming')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-danger">
            <div className="card-body text-center">
              <h6 className="card-title text-danger">Uscite Totali</h6>
              <h4 className="text-danger">
                €{transactions
                  .filter(t => getTransactionDirection(t) === 'outgoing')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-info">
            <div className="card-body text-center">
              <h6 className="card-title text-info">Trasferimenti</h6>
              <h4 className="text-info">
                {transactions.filter(t => t.transaction_type === 'transfer').length}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory; 