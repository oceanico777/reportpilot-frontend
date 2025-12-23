import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Settings, LogOut, Sun, Moon, Users, BarChart3, Calculator } from 'lucide-react';
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
    const { signOut, user, switchRole } = useAuth();

    const handleLogout = async () => {
        await signOut();
        if (close) close(); // Close sidebar if open
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (close) close();
    };

    const ThemeIcon = currentTheme === 'dark-mode' ? Sun : Moon;

    const isAccountant = user?.role === 'accountant';

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''} mobile-sidebar`}>
            <div className="sidebar-header">
                <div className="logo-container" style={{ paddingBottom: '1rem', display: 'flex', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
                    <img src="/logo.png" alt="ReportPilot" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <span className="nav-label">MAIN</span>
                    <div onClick={handleLinkClick}>
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" active={location.pathname === '/dashboard'} />
                    </div>

                    {!isAccountant ? (
                        <>
                            <div onClick={handleLinkClick}>
                                <SidebarItem icon={FileText} label="Reports" to="/reports" active={location.pathname.startsWith('/reports')} />
                            </div>
                            <div onClick={handleLinkClick}>
                                <SidebarItem icon={PlusCircle} label="New Report" to="/new" active={location.pathname === '/new'} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div onClick={handleLinkClick}>
                                <SidebarItem icon={BarChart3} label="Accountant View" to="/admin/dashboard" active={location.pathname === '/admin/dashboard'} />
                            </div>
                            <div onClick={handleLinkClick}>
                                <SidebarItem icon={Users} label="Team Management" to="/team" active={location.pathname === '/team'} />
                            </div>
                            <div onClick={handleLinkClick}>
                                <SidebarItem icon={Calculator} label="Business Insights" to="/insights" active={location.pathname === '/insights'} />
                            </div>
                        </>
                    )}
                </div>

                <div className="nav-section mt-auto">
                    {/* Role Toggle for Dev/Client Review */}
                    <button
                        onClick={() => { switchRole(); if (close) close(); }}
                        className="sidebar-item"
                        style={{ width: '100%', textAlign: 'left', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}
                    >
                        <UserCheck size={20} color="var(--color-primary)" />
                        <span style={{ color: 'var(--color-primary)' }}>Rol: {isAccountant ? 'Contador' : 'Guía'}</span>
                    </button>

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

                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.6rem', color: '#10b981', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem' }}>
                        ReportPilot v1.1.7 (FIXED)
                    </div>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
