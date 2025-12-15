import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SidebarItem = ({ icon: Icon, label, to, active }) => {
    return (
        <Link to={to} className={`sidebar-item ${active ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

const Sidebar = ({ toggleTheme, currentTheme }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, user } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const ThemeIcon = currentTheme === 'dark-mode' ? Sun : Moon;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon"><FileText size={24} color="white" /></div>
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
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/'} />
                    <SidebarItem icon={FileText} label="Reports" to="/reports" active={location.pathname.startsWith('/reports')} />
                    <SidebarItem icon={PlusCircle} label="New Report" to="/new" active={location.pathname === '/new'} />
                </div>

                <div className="nav-section mt-auto">
                    {/* Dark/Light Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="sidebar-item"
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ThemeIcon size={20} />
                        <span>{currentTheme === 'dark-mode' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <SidebarItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
                    <button onClick={handleLogout} className="sidebar-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
