import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Settings,
  PlusCircle,
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './components/Login'

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
          <span className="logo-text">ReportPilot AI</span>
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

const NewReport = () => {
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState(10) // October
  const [year, setYear] = useState(2025)
  const [companyId, setCompanyId] = useState('demo-company-123') // For demo purposes
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { session } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const payload = {
      company_id: companyId,
      month: month,
      year: year,
    }

    try {
      const headers = {
        "Content-Type": "application/json"
      }

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const res = await fetch("http://localhost:8000/reports/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Report generated:", data)
      setSuccess(`Report #${data.id} generation started! Status: ${data.status}`)
    } catch (err) {
      console.error('Error generating report:', err)
      setError('Failed to generate report. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <h1>Create New Report</h1>
      </header>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Company ID</label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
              placeholder="Enter company ID"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Period</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Upload Data (CSV/PDF)</label>
            <div style={{ border: '2px dashed var(--color-border)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Drag and drop files here, or click to browse</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>(File upload coming soon)</p>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
              {success}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Processing...' : 'Generate Report'}
          </button>
        </form>
      </div>
    </div>
  )
}

import Dashboard from './pages/Dashboard';

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
                      <Route path="/reports" element={<div className="page-content"><h1>All Reports</h1></div>} />
                      <Route path="/new" element={<NewReport />} />
                      <Route path="/insights" element={<div className="page-content"><h1>Insights</h1></div>} />
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
