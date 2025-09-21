import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TransferForm from './TransferForm';
import RechargeForm from './RechargeForm';
import TransactionHistory from './TransactionHistory';
import CardManagement from './CardManagement';

const Dashboard = () => {
  const { user, token, updateUserBalance, apiCall, API_BASE_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('balance');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // API_BASE_URL ora viene dal context

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await apiCall(`${API_BASE_URL}/transactions`);

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTransferSuccess = (transaction) => {
    // Aggiorna il saldo dell'utente
    updateUserBalance(user.balance - transaction.amount);
    // Aggiorna la lista delle transazioni
    setTransactions([transaction, ...transactions]);
  };

  const handleRechargeSuccess = (transaction) => {
    // Aggiorna il saldo dell'utente
    updateUserBalance(user.balance + transaction.amount);
    // Aggiorna la lista delle transazioni
    setTransactions([transaction, ...transactions]);
  };

  return (
    <div className="row">
      <div className="col-12">
        <h2 className="mb-4">
          <i className="fas fa-tachometer-alt me-2"></i>
          Dashboard
        </h2>
      </div>

      {/* Card del saldo */}
      <div className="col-md-4 mb-4">
        <div className="card bg-primary text-white h-100">
          <div className="card-body text-center d-flex flex-column">
            <h5 className="card-title">
              <i className="fas fa-wallet me-2"></i>
              Saldo Attuale
            </h5>
            <h2 className="display-4">€{user?.balance?.toFixed(2)}</h2>
            <p className="card-text mt-auto">Disponibile per trasferimenti</p>
          </div>
        </div>
      </div>

      {/* Card informazioni utente */}
      <div className="col-md-4 mb-4">
        <div className="card bg-info text-white h-100">
          <div className="card-body text-center d-flex flex-column">
            <h5 className="card-title">
              <i className="fas fa-user me-2"></i>
              Informazioni Account
            </h5>
            <div className="mt-auto">
              <p className="card-text">
                <strong>Nome:</strong> {user?.full_name || user?.display_name || 'Non specificato'}
              </p>
              <p className="card-text">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="card-text">
                <strong>Membro dal:</strong> {new Date(user?.created_at).toLocaleDateString('it-IT')}
              </p>
              {user?.is_verified && (
                <p className="card-text">
                  <i className="fas fa-check-circle me-1"></i>
                  Account verificato
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card statistiche */}
      <div className="col-md-4 mb-4">
        <div className="card bg-success text-white h-100">
          <div className="card-body text-center d-flex flex-column">
            <h5 className="card-title">
              <i className="fas fa-chart-line me-2"></i>
              Statistiche
            </h5>
            <div className="mt-auto">
              <p className="card-text">
                <strong>Transazioni totali:</strong> {transactions.length}
              </p>
              <p className="card-text">
                <strong>Ultima attività:</strong> {transactions.length > 0 ? new Date(transactions[0].created_at).toLocaleDateString('it-IT') : 'Nessuna'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs per le funzionalità */}
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'balance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('balance')}
                >
                  <i className="fas fa-wallet me-1"></i>
                  Saldo
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'transfer' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transfer')}
                >
                  <i className="fas fa-exchange-alt me-1"></i>
                  Trasferisci
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'recharge' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recharge')}
                >
                  <i className="fas fa-credit-card me-1"></i>
                  Ricarica
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'cards' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cards')}
                >
                  <i className="fas fa-credit-card me-1"></i>
                  Carte
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <i className="fas fa-history me-1"></i>
                  Storico
                </button>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {activeTab === 'balance' && (
              <div className="text-center">
                <h4>Il tuo saldo attuale</h4>
                <div className="display-1 text-primary mb-3">€{user?.balance?.toFixed(2)}</div>
                <p className="text-muted">
                  Questo è il tuo saldo disponibile per trasferimenti e pagamenti.
                </p>
                <div className="row mt-4">
                  <div className="col-md-6">
                    <div 
                      className="card border-success" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveTab('recharge')}
                    >
                      <div className="card-body text-center">
                        <i className="fas fa-arrow-up text-success fa-2x mb-2"></i>
                        <h5>Effettua una ricarica</h5>
                        <p className="text-muted">Aggiungi fondi al tuo account con una carta di credito</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div 
                      className="card border-info" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveTab('transfer')}
                    >
                      <div className="card-body text-center">
                        <i className="fas fa-arrow-right text-info fa-2x mb-2"></i>
                        <h5>Invia denaro</h5>
                        <p className="text-muted">Invia denaro ad altri utenti con il tuo saldo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transfer' && (
              <TransferForm onTransferSuccess={handleTransferSuccess} />
            )}

            {activeTab === 'recharge' && (
              <RechargeForm onRechargeSuccess={handleRechargeSuccess} />
            )}

            {activeTab === 'cards' && (
              <CardManagement />
            )}

            {activeTab === 'history' && (
              <TransactionHistory transactions={transactions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 