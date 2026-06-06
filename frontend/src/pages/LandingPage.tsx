import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, Target, LineChart, Bell } from "lucide-react";

export function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 border-b">
        <h1 className="text-2xl font-bold text-blue-600">InvestorHome</h1>
        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          {t("auth.signIn")}
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Discover Undervalued Properties Across Europe
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Real-time scraping, intelligent deal rating, and market analysis to help you find the best investment opportunities.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Download App
          </button>
          <Link
            to="/login"
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
          >
            Sign In →
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Powerful Investment Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow">
              <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Real-Time Scraping</h4>
              <p className="text-gray-600 text-sm">
                Continuously monitors property listings across multiple European platforms.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow">
              <Target className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Smart Deal Rating</h4>
              <p className="text-gray-600 text-sm">
                Automatically rates properties as Good deals, Fair, or Overpriced based on market data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow">
              <LineChart className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Market Analysis</h4>
              <p className="text-gray-600 text-sm">
                Price indices and trends for every area to track market movements over time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-lg shadow">
              <Bell className="w-10 h-10 text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">Saved Searches</h4>
              <p className="text-gray-600 text-sm">
                Create custom search criteria and get notified when matching properties appear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">1</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Download App</h4>
            <p className="text-gray-600">
              Get the InvestorHome app from Google Play Store on your Android device.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">2</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Register & Setup</h4>
            <p className="text-gray-600">
              Create your account in the app and define your investment search criteria.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-lg">3</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Analyze on Web</h4>
            <p className="text-gray-600">
              Log in here and analyse deals using advanced charts and market trends.
            </p>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section
        id="download"
        className="bg-blue-600 text-white py-20 px-6"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">Download InvestorHome</h3>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Available on Google Play Store. Register your account on mobile and access your data anywhere.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100"
            >
              Get on Google Play
            </a>
          </div>
          <p className="text-sm mt-6 opacity-90">
            Registration is only available in the mobile app. Once registered, use your credentials to log in here.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2026 InvestorHome. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
