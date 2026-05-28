import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import SearchesPage from "./pages/SearchesPage";
import ListingsPage from "./pages/ListingsPage";
import AreasPage from "./pages/AreasPage";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>InvestorHome</h1>
        <nav>
          <NavLink to="/searches">Searches</NavLink>
          <NavLink to="/listings">Listings</NavLink>
          <NavLink to="/areas">Areas &amp; Index</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/searches" replace />} />
          <Route path="/searches" element={<SearchesPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/areas" element={<AreasPage />} />
        </Routes>
      </main>
    </div>
  );
}
