import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Italia');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validazioni
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || 
        !dateOfBirth || !address.trim() || !city.trim() || !postalCode.trim()) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);

    // Prepara i dati per la registrazione
    const userData = {
      email,
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phoneNumber.trim(),
      date_of_birth: dateOfBirth,
      address: address.trim(),
      city: city.trim(),
      postal_code: postalCode.trim(),
      country: country.trim()
    };

    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      // Log dettagliato per debug
      if (result.validationErrors) {
        console.error('Errori di validazione dettagliati:', result.validationErrors);
      }
      
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow">
          <div className="card-header bg-success text-white text-center">
            <h4 className="mb-0">Crea il tuo Account</h4>
            <small>Compila tutti i campi per iniziare</small>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                <div style={{ whiteSpace: 'pre-line' }}>
                  {error}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="firstName" className="form-label">Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="lastName" className="form-label">Cognome</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="phoneNumber" className="form-label">Telefono</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+39 123 456 7890"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="dateOfBirth" className="form-label">Data di nascita</label>
                  <input
                    type="date"
                    className="form-control"
                    id="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="confirmPassword" className="form-label">Conferma Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="address" className="form-label">Indirizzo</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Via Roma 123"
                  required
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="city" className="form-label">Città</label>
                  <input
                    type="text"
                    className="form-control"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Milano"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="postalCode" className="form-label">CAP</label>
                  <input
                    type="text"
                    className="form-control"
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="20100"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="country" className="form-label">Paese</label>
                  <select
                    className="form-select"
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    <option value="Italia">Italia</option>
                    <option value="Francia">Francia</option>
                    <option value="Germania">Germania</option>
                    <option value="Spagna">Spagna</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </button>
            </form>
            
            <div className="text-center mt-3">
              <p className="mb-0">
                Hai già un account?{' '}
                <Link to="/login" className="text-decoration-none">
                  Accedi
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 