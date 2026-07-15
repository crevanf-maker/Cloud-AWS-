import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ConfirmSignup() {
  const { confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await confirmRegistration(email, code);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to confirm account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Confirm your account</h1>
        <p>Enter the verification code emailed to you.</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Verification code
          <input value={code} onChange={(e) => setCode(e.target.value)} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">Account confirmed! Redirecting to login...</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Confirming...' : 'Confirm account'}
        </button>
      </form>
    </div>
  );
}
