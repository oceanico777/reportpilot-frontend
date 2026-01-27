import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Settings,
  PlusCircle,
  BarChart3,
  Calculator,
  LogOut,
  Briefcase,
  Users,
  Menu,
  X
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './components/Login'
import Dashboard from './pages/Dashboard'
import NewPurchase from './pages/NewPurchase'
import Budgets from './pages/Budgets'
import Purchases from './pages/Purchases'
import Insights from './pages/Insights'
import AccountantDashboard from './pages/AccountantDashboard'
import TeamManagement from './pages/TeamManagement'
import LandingPage from './pages/LandingPage'
import DailyClosures from './pages/DailyClosures'
import Providers from './pages/Providers'
import Inventory from './pages/Inventory'
import Recipes from './pages/Recipes'
import Sidebar from './components/Sidebar'

import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark-mode');

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark-mode' ? 'light-mode' : 'dark-mode');
  };

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="app-layout">
                    {/* Mobile Toggle & Overlay */}
                    <div
                      className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                      onClick={() => setIsSidebarOpen(false)}
                    />
                    <button
                      className="mobile-nav-toggle"
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      aria-label="Toggle Menu"
                    >
                      {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <Sidebar
                      isOpen={isSidebarOpen}
                      close={() => setIsSidebarOpen(false)}
                      toggleTheme={toggleTheme}
                      currentTheme={theme}
                    />

                    <main className="main-content">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/new" element={<NewPurchase />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/insights" element={<Insights />} />
                        <Route path="/providers" element={<Providers />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/recipes" element={<Recipes />} />
                        <Route path="/admin/dashboard" element={<AccountantDashboard />} />
                        <Route path="/team" element={<TeamManagement />} />
                        <Route path="/settings" element={<div className="page-content"><h1>Settings</h1></div>} />
                        <Route path="/closures" element={<DailyClosures />} />

                        {/* Fallback to dashboard if inside app */}
                        <Route path="*" element={<Dashboard />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App
