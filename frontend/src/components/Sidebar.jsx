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

const Sidebar = ({ toggleTheme, currentTheme, isOpen, close }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, user } = useAuth();

    const handleLogout = async () => {
        await signOut();
        if (close) close(); // Close sidebar if open
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (close) close();
    };

    const ThemeIcon = currentTheme === 'dark-mode' ? Sun : Moon;

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container" style={{ paddingBottom: '1rem', display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
                    <img src="/logo.png" alt="ReportPilot" style={{ height: '40px', objectFit: 'contain' }} />
                </div>

            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">MAIN</span>
                    <div onClick={handleLinkClick}>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={location.pathname === '/' || location.pathname === '/admin/dashboard'} />
                    </div>
                    <div onClick={handleLinkClick}>
                        <SidebarItem icon={FileText} label="Reports" to="/reports" active={location.pathname.startsWith('/reports')} />
                    </div>
                    <div onClick={handleLinkClick}>
                        <SidebarItem icon={PlusCircle} label="New Report" to="/new" active={location.pathname === '/new'} />
                    </div>
                </div>

                <div className="nav-section mt-auto">
                    {/* Dark/Light Mode Toggle */}
                    <button
                        onClick={() => { if (toggleTheme) toggleTheme(); if (close) close(); }}
                        className="sidebar-item"
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <ThemeIcon size={20} />
                        <span>{currentTheme === 'dark-mode' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>

                    <div onClick={handleLinkClick}>
                        <SidebarItem icon={Settings} label="Settings" to="/settings" active={location.pathname === '/settings'} />
                    </div>
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
