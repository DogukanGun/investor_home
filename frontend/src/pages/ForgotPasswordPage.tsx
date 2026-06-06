import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import './Auth.css';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Panel: Branding */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-mark">IH</div>
            <div className="auth-brand-name">InvestorHome</div>
          </div>

          <h2 className="auth-headline">Discover undervalued properties across Europe.</h2>

          <div className="auth-stats">
            <div className="auth-stat">
              <div className="auth-stat-dot accent"></div>
              <span>12,000+ active listings</span>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-dot good"></div>
              <span>6 countries covered</span>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-dot fair"></div>
              <span>Updated every 6 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="auth-right">
        <div className="auth-card">
          {submitted ? (
            <div className="auth-success">
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✉️</div>
              <div className="auth-success-title">{t('auth.checkYourEmail')}</div>
              <p className="auth-success-text">{t('auth.resetLinkSent')}</p>
              <p className="auth-success-text" style={{ marginTop: '12px' }}>{t('auth.linkExpiresIn')}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn primary"
                style={{ width: '100%', marginTop: '24px' }}
              >
                {t('auth.backToLogin')}
              </button>
            </div>
          ) : (
            <>
              <h1 className="auth-title">{t('auth.resetPassword')}</h1>
              <p className="auth-subtitle">{t('auth.enterEmailReset')}</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">{t('auth.email')}</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                    disabled={loading}
                    placeholder="you@example.com"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn primary auth-submit">
                  {loading && <span className="auth-spinner"></span>}
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
                </button>
              </form>

              <div className="auth-footer-note">
                {t('auth.rememberPassword')} <br />
                <button
                  onClick={() => navigate('/login')}
                  className="auth-link"
                  style={{ marginTop: '8px' }}
                >
                  {t('auth.signIn')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
