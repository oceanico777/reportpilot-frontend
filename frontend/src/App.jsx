import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Settings,
  PlusCircle,
  BarChart3,
  Calculator,
  LogOut
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './components/Login'
import Dashboard from './pages/Dashboard'
import NewReport from './pages/NewReport'
import Planning from './pages/Planning'

const SidebarItem = ({ icon: Icon, label, to, active }) => {
  return (
    <Link
      to={to}
      className={`sidebar-item ${active ? 'active' : ''}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  )
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <FileText size={24} color="white" />
          </div>
          <span className="logo-text">ReportPilot</span>
        </div>
        {user && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {user.email}
          </p>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-label">MAIN</span>
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            to="/"
            active={location.pathname === '/'}
          />
          <SidebarItem
            icon={FileText}
            label="Reports"
            to="/reports"
            active={location.pathname.startsWith('/reports')}
          />
          <SidebarItem
            icon={PlusCircle}
            label="New Report"
            to="/new"
            active={location.pathname === '/new'}
          />
          <SidebarItem
            icon={Calculator}
            label="Proyecciones"
            to="/planning"
            active={location.pathname === '/planning'}
          />
        </div>

        <div className="nav-section">
          <span className="nav-label">ANALYTICS</span>
          <SidebarItem
            icon={BarChart3}
            label="Insights"
            to="/insights"
            active={location.pathname === '/insights'}
          />
        </div>

        <div className="nav-section mt-auto">
          <SidebarItem
            icon={Settings}
            label="Settings"
            to="/settings"
            active={location.pathname === '/settings'}
          />
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}


import Reports from './pages/Reports'
import Insights from './pages/Insights'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/new" element={<NewReport />} />
                      <Route path="/planning" element={<Planning />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/settings" element={<div className="page-content"><h1>Settings</h1></div>} />
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
