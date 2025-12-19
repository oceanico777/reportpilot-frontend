import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Copy, Trash2, Shield, User } from 'lucide-react';

const TeamManagement = () => {
    const { session } = useAuth();
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.access_token) {
            fetchTeam();
        }
    }, [session]);

    const fetchTeam = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/admin/team`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeamData(data);
            } else {
                // Handle non-admin error gracefully
                console.error("Failed to fetch team");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (teamData?.invitation_code) {
            navigator.clipboard.writeText(teamData.invitation_code);
            alert("Código copiado al portapapeles");
        }
    };

    const handleDeactivate = async (userId) => {
        if (!confirm("¿Estás seguro de desactivar a este usuario?")) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/admin/deactivate/${userId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                fetchTeam(); // Refresh
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="page-content" style={{ textAlign: 'center', marginTop: '4rem' }}>Cargando equipo...</div>;

    if (!teamData) return (
        <div className="page-content">
            <h1>Acceso Restringido</h1>
            <p>Solo los administradores pueden ver esta página.</p>
        </div>
    );

    return (
        <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                        Gestión de Equipo
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>{teamData.company_name}</p>
                </div>
            </header>

            {/* Invitation Code Card */}
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--gradient-surface)', border: '1px solid var(--color-border)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} /> Código de Invitación
                </h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Comparte este código con tus guías para que se unan a tu organización automáticamente.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        background: '#1e293b', padding: '1rem 2rem', borderRadius: '8px',
                        fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace',
                        border: '1px solid var(--color-border)'
                    }}>
                        {teamData.invitation_code}
                    </div>
                    <button onClick={handleCopyCode} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Copy size={18} /> Copiar
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Usuario</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Rol</th>
                                <th style={{ textAlign: 'center', padding: '1rem' }}>Estado</th>
                                <th style={{ textAlign: 'right', padding: '1rem' }}>Gasto Total</th>
                                <th style={{ textAlign: 'center', padding: '1rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamData.members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>{member.full_name || 'Sin Nombre'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{member.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {member.role === 'ADMIN' ? <Shield size={14} color="#f59e0b" /> : <User size={14} color="#94a3b8" />}
                                            <span style={{ fontSize: '0.9rem' }}>{member.role}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                            background: member.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: member.status === 'Active' ? '#10b981' : '#ef4444'
                                        }}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(member.total_spent)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {member.role !== 'ADMIN' && (
                                            <button
                                                onClick={() => handleDeactivate(member.id)}
                                                className="btn-icon"
                                                title="Desactivar"
                                                style={{ color: '#ef4444' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
