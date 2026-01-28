import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Search, MapPin, Phone, Mail, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Providers = () => {
    const { session } = useAuth();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProvider, setNewProvider] = useState({ name: '', phone: '', category: '' });

    useEffect(() => {
        if (session?.access_token) {
            fetchProviders();
        }
    }, [session]);

    const fetchProviders = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_URL}/providers/`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProviders(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_URL}/providers/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newProvider)
            });

            if (res.ok) {
                fetchProviders(); // Refresh list
                setShowModal(false);
                setNewProvider({ name: '', phone: '', category: '' });
            } else {
                alert("Error al crear proveedor");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleExport = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_URL}/exports/providers-excel`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Proveedores_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Error al descargar reporte");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión");
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Proveedores</h1>
                    <p className="page-subtitle">Administra tus contactos y categorías de suministros</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={handleExport}>
                        <Package size={20} />
                        <span>Descargar Excel</span>
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        <span>Nuevo Proveedor</span>
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid mb-8">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Proveedores</p>
                        <p className="stat-value">{providers.length}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
                </div>
            ) : (
                <div className="data-grid">
                    {providers.map((p) => (
                        <div key={p.id} className="card p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{p.name || 'Sin nombre'}</h3>
                                    <span className="badge mt-2 inline-block">{p.category || 'General'}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Phone size={16} />
                                    <span>{p.phone || 'Sin télefono'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {providers.length === 0 && (
                        <div className="col-span-full text-center p-8 text-gray-500">
                            No hay proveedores registrados.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="text-xl font-bold mb-4">Nuevo Proveedor</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre Empresa</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={newProvider.name}
                                    onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Categoría</label>
                                <select
                                    className="input-field"
                                    value={newProvider.category}
                                    onChange={e => setNewProvider({ ...newProvider, category: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Carnes">Carnes</option>
                                    <option value="Bebidas">Bebidas</option>
                                    <option value="Verduras">Verduras</option>
                                    <option value="Aseo">Aseo</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newProvider.phone}
                                    onChange={e => setNewProvider({ ...newProvider, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Providers;
