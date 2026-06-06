import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./LandingPage.css";

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <h1>InvestorHome</h1>
        <Link to="/login">{t("auth.signIn")}</Link>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <h2>Discover Undervalued Properties Across Europe</h2>
        <p>
          Real-time scraping, intelligent deal rating, and market analysis to help you find the best investment opportunities.
        </p>
        <div className="landing-cta">
          <button
            onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth" })}
            className="btn primary"
          >
            Download App
          </button>
          <Link to="/login" className="btn-outline">
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <h3>Powerful Investment Tools</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Real-Time Scraping</h4>
            <p>Continuously monitors property listings across multiple European platforms.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4>Smart Deal Rating</h4>
            <p>Automatically rates properties as Good deals, Fair, or Overpriced based on market data.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h4>Market Analysis</h4>
            <p>Price indices and trends for every area to track market movements over time.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h4>Saved Searches</h4>
            <p>Create custom search criteria and get notified when matching properties appear.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-how">
        <h3>How It Works</h3>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Download App</h4>
            <p>Get the InvestorHome app from Google Play Store on your Android device.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h4>Register & Setup</h4>
            <p>Create your account in the app and define your investment search criteria.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h4>Analyze on Web</h4>
            <p>Log in here and analyse deals using advanced charts and market trends.</p>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="landing-download">
        <div className="download-content">
          <h3>Download InvestorHome</h3>
          <p>Available on Google Play Store. Register your account on mobile and access your data anywhere.</p>
          <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="btn primary">
            Get on Google Play
          </a>
          <p className="small-text">
            Registration is only available in the mobile app. Once registered, use your credentials to log in here.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 InvestorHome. All rights reserved.</p>
      </footer>
    </div>
  );
}
