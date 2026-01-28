import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Copy, Trash2, Shield, User } from 'lucide-react';

const TeamManagement = () => {
    const { session } = useAuth();
    const [teamData, setTeamData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'STAFF' });
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.access_token) {
            fetchTeam();
        }
    }, [session]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/admin/team`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeamData(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId) => {
        if (!window.confirm("¿Seguro que deseas cambiar el estado de este usuario?")) return;
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/admin/deactivate/${userId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                fetchTeam();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCopyCode = () => {
        if (teamData?.invitation_code) {
            navigator.clipboard.writeText(teamData.invitation_code);
            alert("Código copiado al portapapeles");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                alert("Usuario creado exitosamente. Puede iniciar sesión con este correo.");
                setShowModal(false);
                setNewUser({ full_name: '', email: '', role: 'STAFF' });
                fetchTeam();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'No se pudo crear el usuario'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '80vh' }}>
            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        </div>
    );

    if (!teamData) return (
        <div className="page-content">
            <h1>Acceso Restringido</h1>
            <p>Solo los administradores pueden ver esta página.</p>
        </div>
    );

    return (
        <div className="page-content" style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
            <header className="page-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', letterSpacing: '-0.03em' }}>
                        Gestión de Equipo
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                        Administra tu equipo de trabajo en {teamData.company_name}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', gap: '8px', padding: '0.75rem 1.5rem' }}
                >
                    <User size={20} />
                    <span>Nuevo Miembro</span>
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>

                {/* Members Table Section */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Personal del Equipo</h3>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{teamData.members.length} miembros</span>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</th>
                                    <th style={{ textAlign: 'left', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                                    <th style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ textAlign: 'right', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasto Histórico</th>
                                    <th style={{ textAlign: 'center', padding: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamData.members.map(member => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{member.full_name || 'Sin Nombre'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{member.email}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {member.role === 'ADMIN' ?
                                                    <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Shield size={12} /> Admin
                                                    </span>
                                                    :
                                                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <User size={12} /> Staff
                                                    </span>
                                                }
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                                background: member.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: member.status === 'Active' ? '#10b981' : '#ef4444',
                                                border: `1px solid ${member.status === 'Active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                            }}>
                                                {member.status === 'Active' ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '500', color: 'var(--color-text-main)' }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(member.total_spent)}
                                        </td>
                                        <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                                            {member.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDeactivate(member.id)}
                                                    className="btn-icon"
                                                    title={member.status === 'Active' ? "Desactivar usuario" : "Activar usuario"}
                                                    style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invitation Code Card - Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#38bdf8' }}>
                            <Users size={24} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', margin: 0 }}>Invitar Personal</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Comparte este código único para que los nuevos miembros del staff se unan automáticamente a tu organización.
                        </p>

                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px',
                                fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '3px', fontFamily: 'var(--font-mono)',
                                textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8'
                            }}>
                                {teamData.invitation_code}
                            </div>
                        </div>

                        <button
                            onClick={handleCopyCode}
                            className="btn-primary"
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            <Copy size={18} />
                            <span>Copiar Código</span>
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <h4 style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>Nota Importante</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                            El personal que se registre tendrá acceso limitado hasta que se le asigne un turno activo.
                        </p>
                    </div>
                </div>

            </div>

            {/* CREATE USER MODAL */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Registrar Nuevo Miembro</h2>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="juan@ejemplo.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    className="form-input"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="GUIDE">Staff / Cajero</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={creating}
                                >
                                    {creating ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
