import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Filter, Search, Calendar, Briefcase, XCircle } from 'lucide-react';

const AccountantDashboard = () => {
    const { session } = useAuth();
    const [summary, setSummary] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [viewMode, setViewMode] = useState('transactions'); // Default to transactions view as requested

    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        user_id: ''
    });
    const [exporting, setExporting] = useState(false);

    // Fetch Data based on view mode
    useEffect(() => {
        if (session?.access_token) {
            // Always fetch summary for the KPI cards (Total Month)
            fetchSummary();

            // Then fetch list if in transactions mode
            if (viewMode === 'transactions') {
                fetchTransactions();
            }
        }
    }, [session, filters, viewMode]);

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

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const query = new URLSearchParams({
                month: filters.month,
                year: filters.year,
                limit: 100 // Fetch last 100 for speed
            }).toString();

            const res = await fetch(`${API_URL}/reports/admin/transactions?${query}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
        } finally {
            setLoadingTransactions(false);
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
                if (data.download_url) {
                    // Open in new tab to trigger download
                    window.open(data.download_url, '_blank');
                } else {
                    alert(`Exportación iniciada (Task ID: ${data.task_id}). Te notificaremos cuando esté lista.`);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Error iniciando exportación: ${errData.detail || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setExporting(false);
        }
    };

    const handleExportXlsx = async (tourId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/exports/tours/${tourId}/xlsx`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Gastos_${tourId}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Error al descargar el archivo Excel");
            }
        } catch (err) {
            console.error("Excel export error:", err);
            alert("Error de conexión al exportar Excel");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    };

    // Calculate Totals for Header
    const totalMonth = summary.reduce((acc, curr) => acc + (Number(curr.total_expenses) || 0), 0);

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

            {/* VIEW TOGGLE */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setViewMode('tours')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'tours' ? 'var(--color-primary)' : 'transparent',
                        color: viewMode === 'tours' ? 'white' : 'var(--color-text-muted)',
                        border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    📁 Resumen por Tour
                </button>
                <button
                    onClick={() => setViewMode('transactions')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'transactions' ? 'var(--color-primary)' : 'transparent',
                        color: viewMode === 'transactions' ? 'white' : 'var(--color-text-muted)',
                        border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    ⚡ Últimos Movimientos (Sábana)
                </button>
            </div>

            {/* Data Table Area */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>

                {/* VISTA: TOURS SUMMARY */}
                {viewMode === 'tours' && (
                    <div className="table-container">
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }}>
                                <tr>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOUR ID</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GUÍA</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 ANTICIPO</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💵 RECAUDO</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📉 GASTOS</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚖️ DIFERENCIA</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ESTADO</th>
                                    <th style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}><div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%' }}></div></td></tr>
                                ) : summary.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>No hay tours registrados.</td></tr>
                                ) : (
                                    summary.map((tour, idx) => {
                                        const anticipo = tour.total_advances || 0;
                                        const recaudo = tour.total_collections || 0;
                                        const gastos = tour.total_expenses || 0;
                                        const diferencia = (anticipo + recaudo) - gastos;
                                        return (
                                            <tr key={idx} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '1rem' }}>{tour.tour_id}</td>
                                                <td style={{ padding: '1rem' }}>{tour.guide_name || 'Guía'}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>{formatCurrency(anticipo)}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', color: '#6ee7b7' }}>{formatCurrency(recaudo)}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>{formatCurrency(gastos)}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', color: diferencia < 0 ? '#93c5fd' : '#fca5a5' }}>
                                                    {formatCurrency(diferencia)}
                                                </td>
                                                <td style={{ padding: '1rem' }}><span className="badge success">Activo</span></td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button onClick={() => handleExportXlsx(tour.tour_id)} className="btn-icon"><Download size={16} /></button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* VISTA: MOVIMIENTOS (SÁBANA) */}
                {viewMode === 'transactions' && (
                    <div className="table-container">
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(56, 189, 248, 0.1)', backdropFilter: 'blur(8px)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#38bdf8' }}>FECHA</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#38bdf8' }}>TOUR REF</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#38bdf8' }}>PROVEEDOR</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', color: '#38bdf8' }}>CATEGORÍA</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', color: '#38bdf8' }}>MONTO</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', color: '#38bdf8' }}>EVIDENCIA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTransactions ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Cargando movimientos...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No hay movimientos recientes.</td></tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '0.8rem' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{tx.tour_id}</td>
                                            <td style={{ padding: '0.8rem' }}>{tx.vendor || 'N/A'}</td>
                                            <td style={{ padding: '0.8rem' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)' }}>
                                                    {tx.category || 'Varios'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(tx.amount)}</td>
                                            <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                                                {tx.source_file_path ? (
                                                    <a href={tx.source_file_path} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.8rem' }}>
                                                        🔗 Ver Foto
                                                    </a>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountantDashboard;
