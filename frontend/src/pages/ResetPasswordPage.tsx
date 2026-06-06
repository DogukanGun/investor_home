import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import './Auth.css';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="auth-layout">
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
        <div className="auth-right">
          <div className="auth-card">
            <h1 className="auth-title">{t('auth.invalidResetLink')}</h1>
            <p className="auth-subtitle">{t('auth.invalidResetLink')}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn primary"
              style={{ width: '100%', marginTop: '24px' }}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-layout">
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
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-success">
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✓</div>
              <div className="auth-success-title">{t('auth.passwordReset')}</div>
              <p className="auth-success-text">{t('auth.passwordUpdated')}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn primary"
                style={{ width: '100%', marginTop: '24px' }}
              >
                {t('auth.goToLogin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-layout">
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
      <div className="auth-right">
        <div className="auth-card">
          <h1 className="auth-title">{t('auth.resetPassword')}</h1>
          <p className="auth-subtitle">{t('auth.enterNewPassword')}</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="password" className="auth-label">{t('auth.newPassword')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-label">{t('auth.confirmPassword')}</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="btn primary auth-submit">
              {loading && <span className="auth-spinner"></span>}
              {loading ? t('auth.resetting') : t('auth.resetPassword')}
            </button>
          </form>

          <button
            onClick={() => navigate('/login')}
            className="auth-link"
            style={{ display: 'block', marginTop: '20px', textAlign: 'center', width: '100%' }}
          >
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
