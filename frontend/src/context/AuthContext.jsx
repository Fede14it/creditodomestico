import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Aggiunto stato di caricamento

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      // Se non c'è token, non siamo autenticati e abbiamo finito di caricare
      setIsLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Controlla se c'è un nuovo token nell'header (sliding session)
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        console.log('[AUTH] Token rinnovato automaticamente');
      }

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setIsLoading(false); // Finito di caricare con successo
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false); // Finito di caricare dopo login/registrazione
        localStorage.setItem('token', data.access_token);
        return { success: true };
      } else {
        const errorData = await response.json();
        
        // Gestione specifica per errori 422 (validazione)
        if (response.status === 422) {
          console.error('Errore di validazione 422:', errorData);
          return { 
            success: false, 
            error: 'Dati di login non validi',
            validationErrors: errorData.detail
          };
        }
        
        return { 
          success: false, 
          error: errorData.detail || 'Errore durante il login' 
        };
      }
    } catch (error) {
      console.error('Errore di connessione:', error);
      return { success: false, error: 'Errore di connessione al server' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false); // Finito di caricare dopo login/registrazione
        localStorage.setItem('token', data.access_token);
        return { success: true };
      } else {
        const errorData = await response.json();
        
        // Gestione specifica per errori 422 (validazione)
        if (response.status === 422) {
          console.error('Errore di validazione 422:', errorData);
          
          // Estrai i messaggi di errore dai dettagli di validazione
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail.map(err => {
              // Usa il campo formattato dal backend o estrai dall'oggetto
              const field = err.field || (err.loc ? err.loc[err.loc.length - 1] : 'campo');
              const message = err.message || err.msg || 'Errore di validazione';
              
              // Traduci i nomi dei campi in italiano
              const fieldTranslations = {
                'email': 'Email',
                'password': 'Password',
                'first_name': 'Nome',
                'last_name': 'Cognome',
                'phone_number': 'Telefono',
                'date_of_birth': 'Data di nascita',
                'address': 'Indirizzo',
                'city': 'Città',
                'postal_code': 'Codice postale',
                'country': 'Paese'
              };
              
              const translatedField = fieldTranslations[field] || field;
              return `${translatedField}: ${message}`;
            }).join('\n');
            
            return { 
              success: false, 
              error: `Errori di validazione:\n${validationErrors}`,
              validationErrors: errorData.detail
            };
          }
          
          return { 
            success: false, 
            error: errorData.message || 'Errore di validazione dei dati inseriti',
            validationErrors: errorData.detail
          };
        }
        
        // Altri errori
        return { 
          success: false, 
          error: errorData.detail || 'Errore durante la registrazione' 
        };
      }
    } catch (error) {
      console.error('Errore di connessione:', error);
      return { success: false, error: 'Errore di connessione al server' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false); // Finito di caricare dopo logout
    localStorage.removeItem('token');
  };

  const updateUserBalance = (newBalance) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  // Helper per chiamate API con refresh automatico del token
  const apiCall = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Controlla se c'è un nuovo token (sliding session)
    const newToken = response.headers.get('X-New-Token');
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('token', newToken);
      console.log('[AUTH] Token rinnovato automaticamente durante API call');
    }

    return response;
  };

  // Card management functions
  const getUserCards = async () => {
    try {
      const response = await apiCall(`${API_BASE_URL}/cards`);

      if (response.ok) {
        const data = await response.json();
        return { success: true, cards: data.cards };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      return { success: false, error: 'Errore di connessione' };
    }
  };

  const setDefaultCard = async (cardId) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/cards/${cardId}/default`, {
        method: 'PUT',
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      return { success: false, error: 'Errore di connessione' };
    }
  };

  const deleteCard = async (cardId) => {
    try {
      const response = await apiCall(`${API_BASE_URL}/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail };
      }
    } catch (error) {
      return { success: false, error: 'Errore di connessione' };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading, // Esporta lo stato di caricamento
    login,
    register,
    logout,
    updateUserBalance,
    getUserCards,
    setDefaultCard,
    deleteCard,
    apiCall, // Esporta la funzione per altri componenti
    API_BASE_URL, // Esporta l'URL per altri componenti
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 