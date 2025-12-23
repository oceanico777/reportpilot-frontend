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
import NewReport from './pages/NewReport'
import Planning from './pages/Planning'
import Reports from './pages/Reports'
import Insights from './pages/Insights'
import AccountantDashboard from './pages/AccountantDashboard'
import TeamManagement from './pages/TeamManagement'
import LandingPage from './pages/LandingPage'
import TourClosure from './pages/TourClosure'
import Sidebar from './components/Sidebar'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
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

                  <Sidebar isOpen={isSidebarOpen} close={() => setIsSidebarOpen(false)} />

                  <main className="main-content">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/new" element={<NewReport />} />
                      <Route path="/planning" element={<Planning />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/admin/dashboard" element={<AccountantDashboard />} />
                      <Route path="/team" element={<TeamManagement />} />
                      <Route path="/settings" element={<div className="page-content"><h1>Settings</h1></div>} />
                      <Route path="/tour-closure/:tourId" element={<TourClosure />} />

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
  )
}

export default App
