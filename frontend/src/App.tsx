import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import ListingsPage from "./pages/ListingsPage";
import AreasPage from "./pages/AreasPage";
import SearchesPage from "./pages/SearchesPage";
import AnalysisPage from "./pages/AnalysisPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

export default function App() {
  return (
    <Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <div className="shell">
            <Sidebar />
            <main className="main">
              <Routes>
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<DashboardPage />} />
                <Route path="/browse" element={<ListingsPage />} />
                <Route path="/areas" element={<AreasPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/searches" element={<SearchesPage />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  );
}
