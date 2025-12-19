import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Filter, Search, Calendar, Briefcase, XCircle } from 'lucide-react';

const AccountantDashboard = () => {
    const { session } = useAuth();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        user_id: ''
    });
    const [exporting, setExporting] = useState(false);

    // Fetch Data
    useEffect(() => {
        if (session?.access_token) {
            fetchSummary();
        }
    }, [session, filters]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const query = new URLSearchParams({
                month: filters.month,
                year: filters.year,
                ...(filters.user_id && { user_id: filters.user_id })
            }).toString();

            const res = await fetch(`${API_URL}/reports/admin/summary?${query}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            }
        } catch (err) {
            console.error("Error fetching summary:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportZip = async () => {
        setExporting(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/admin/export-zip?month=${filters.month}&year=${filters.year}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Exportación iniciada (Task ID: ${data.task_id}). Te notificaremos cuando esté lista.`);
            } else {
                alert("Error iniciando exportación");
            }
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    };

    // Calculate Totals for Header
    const totalMonth = summary.reduce((acc, curr) => acc + curr.total_amount, 0);

    return (
        <div className="page-content" style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
            {/* Header */}
            <header className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', letterSpacing: '-0.03em' }}>
                        Portal Contable
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Auditoría y control de gastos por Tour</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="glass-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(30, 41, 59, 0.6)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total {filters.month}/{filters.year}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-accent)', fontFamily: 'var(--font-heading)' }}>{formatCurrency(totalMonth)}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters & Actions Bar */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="var(--color-text-muted)" />
                        <select
                            className="form-input"
                            style={{ width: 'auto', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'white' }}
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1} style={{ background: 'var(--color-surface)' }}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            style={{ width: 'auto', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'white' }}
                            value={filters.year}
                            onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        >
                            {[2023, 2024, 2025].map(y => (
                                <option key={y} value={y} style={{ background: 'var(--color-surface)' }}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                        <Search size={18} color="var(--color-text-muted)" />
                        <input
                            type="text"
                            placeholder="Filtrar por Guía (ID)..."
                            className="form-input"
                            style={{ width: '180px', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'white' }}
                            value={filters.user_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                        />
                    </div>
                </div>

                <button
                    onClick={handleExportZip}
                    disabled={exporting}
                    className="btn-premium"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                >
                    {exporting ? (
                        <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    ) : (
                        <Download size={18} />
                    )}
                    <span>{exporting ? 'Generando ZIP...' : 'Descargar Recibos (ZIP)'}</span>
                </button>
            </div>

            {/* Data Table */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
                            <tr>
                                <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOUR ID</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GUÍA</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 ANTICIPO</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💵 RECAUDO</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📉 GASTOS</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🍽️ REST</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎟️ ATRAC</th>
                                <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-accent)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚖️ DIFERENCIA</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                    </td>
                                </tr>
                            ) : summary.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <Briefcase size={40} opacity={0.5} />
                                            <span>No hay registros para este periodo.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                summary.map((tour, idx) => {
                                    // Calculate Logic
                                    const anticipo = tour.total_advances || 0;
                                    const recaudo = tour.total_collections || 0;
                                    const gastos = tour.total_expenses || 0;
                                    const diferencia = (anticipo + recaudo) - gastos; // Positive = Guide has money. Negative = Guide owed money.

                                    let statusColor = '#94a3b8';
                                    let statusText = 'Pendiente';
                                    let diffColor = 'white';

                                    if (diferencia > 0) {
                                        statusColor = '#ef4444'; // Red
                                        statusText = 'REINTEGRAR';
                                        diffColor = '#fca5a5';
                                    } else if (diferencia < 0) {
                                        statusColor = '#3b82f6'; // Blue
                                        statusText = 'REEMBOLSAR';
                                        diffColor = '#93c5fd';
                                    } else {
                                        statusColor = '#10b981'; // Green
                                        statusText = 'CUADRE OK';
                                        diffColor = '#86efac';
                                    }

                                    return (
                                        <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.2rem', fontWeight: '500', fontFamily: 'monospace', fontSize: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {tour.tour_id}
                                                    {tour.has_duplicates && (
                                                        <div title="Posibles duplicados" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', padding: '2px' }}>
                                                            <XCircle size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td style={{ padding: '1.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-ocean)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff' }}>
                                                        {tour.guide_name ? tour.guide_name.charAt(0).toUpperCase() : 'G'}
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>{tour.guide_name || 'Desconocido'}</span>
                                                </div>
                                            </td>

                                            {/* ANTICIPO */}
                                            <td style={{ padding: '1.2rem', textAlign: 'right', color: '#fbbf24', fontFamily: 'monospace', fontWeight: '600' }}>
                                                {formatCurrency(anticipo)}
                                            </td>

                                            {/* RECAUDO */}
                                            <td style={{ padding: '1.2rem', textAlign: 'right', color: '#6ee7b7', fontFamily: 'monospace', fontWeight: '600' }}>
                                                {formatCurrency(recaudo)}
                                            </td>

                                            {/* GASTOS TOTALES */}
                                            <td style={{ padding: '1.2rem', textAlign: 'right', color: 'white', fontFamily: 'monospace' }}>
                                                {formatCurrency(gastos)}
                                            </td>

                                            {/* DESGLOSE (Simplificado) */}
                                            <td style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                {formatCurrency(tour.categories['🍽️ Restaurante'] || 0)}
                                            </td>
                                            <td style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                {formatCurrency(tour.categories['🎟️ Atractivo'] || 0)}
                                            </td>

                                            {/* DIFERENCIA */}
                                            <td style={{ padding: '1.2rem', textAlign: 'right', fontWeight: 'bold', color: diffColor, fontFamily: 'monospace', fontSize: '1.05rem', background: `rgba(${diferencia > 0 ? '239, 68, 68' : diferencia < 0 ? '59, 130, 246' : '16, 185, 129'}, 0.05)` }}>
                                                {formatCurrency(diferencia)}
                                            </td>

                                            {/* ESTADO */}
                                            <td style={{ padding: '1.2rem' }}>
                                                <span style={{
                                                    fontWeight: '700',
                                                    color: statusColor,
                                                    background: `${statusColor}20`, // 20 hex alpha = ~12% opacity
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountantDashboard;
