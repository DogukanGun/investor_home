import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import ListingsPage from "./pages/ListingsPage";
import AreasPage from "./pages/AreasPage";
import SearchesPage from "./pages/SearchesPage";

export default function App() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<DashboardPage />} />
          <Route path="/browse" element={<ListingsPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/searches" element={<SearchesPage />} />
        </Routes>
      </main>
    </div>
  );
}
