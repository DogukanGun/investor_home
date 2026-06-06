import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { useTranslation } from "react-i18next";
import "./Auth.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.login(email, password);
      login(response.access_token, response.email, response.name);
      navigate("/overview", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h1 className="auth-title">{t("auth.signIn")}</h1>
          <p className="auth-subtitle">{t("auth.accessDashboard")}</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">{t("auth.email")}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">{t("auth.password")}</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Link to="/forgot-password" className="auth-link">{t("auth.forgotPassword")}</Link>
            </div>

            <button type="submit" disabled={loading} className="btn primary auth-submit">
              {loading && <span className="auth-spinner"></span>}
              {loading ? "Signing in..." : t("auth.signIn")}
            </button>
          </form>

          <div className="auth-footer-note">
            {t("auth.dontHaveAccount")} <br />
            {t("auth.downloadAppToRegister") || "Download the mobile app to create an account"}
          </div>
        </div>
      </div>
    </div>
  );
}
