import { useState, useEffect } from 'react';
import { FileText, Search, Filter, ArrowRight, Loader, Trash2, Eye, X, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ExportModal from '../components/ExportModal';

const Reports = () => {
    const { session } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isExportOpen, setIsExportOpen] = useState(false);

    useEffect(() => {
        if (session?.access_token) {
            fetchReports();
        }
    }, [session]);

    const fetchReports = async () => {
        try {
            // Force proxy /api in production to avoid CORS and mixed content issues
            const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
            console.log("DEBUG: Fetching reports from:", `${API_URL}/purchases`);
            // Fetch all reports, newest first
            const res = await fetch(`${API_URL}/purchases?limit=50&skip=0`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            setReports(data);
        } catch (err) {
            console.error("CRITICAL: Error fetching reports:", err);
            console.error("Full error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
            setError(`Error al cargar reportes: ${err.message}. Verifica la conexión con el servidor.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;

        setDeletingId(id);
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_URL}/purchases/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!res.ok) throw new Error("Failed to delete");

            // Remove from local state
            setReports(reports.filter(r => r.id !== id));
        } catch (err) {
            alert("Error deleting report: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount, currency) => {
        if (amount === undefined || amount === null) return '-';
        return `${currency || '$'} ${parseFloat(amount).toFixed(2)}`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SENT': return 'processing';
            case 'DRAFT': return 'default';
            case 'PROCESSED': return 'success';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'error';
            case 'PENDING_REVIEW': return 'processing';
            case 'PROCESSING': return 'processing';
            case 'FAILED': return 'error';
            default: return 'default';
        }
    };

    return (
        <div className="page-content">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Historial</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Registro completo de compras e insumos</p>
                </div>
                <button
                    onClick={() => setIsExportOpen(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    disabled={reports.length === 0}
                >
                    <Download size={18} />
                    <span>Exportar</span>
                </button>
            </header>

            <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />

            {/* ERROR STATE */}
            {error && (
                <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-danger)', marginBottom: '1rem' }}>
                    <p style={{ color: 'var(--color-danger)' }}>{error}</p>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader className="animate-spin" size={32} color="var(--color-primary)" />
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && reports.length === 0 && (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <h3 style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Sin reportes</h3>
                    <p>Los nuevos reportes aparecerán aquí.</p>
                </div>
            )}

            {/* DATA TABLE */}
            {!loading && !error && reports.length > 0 && (
                <div className="card table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>Referencia</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                padding: '0.5rem',
                                                borderRadius: '50%'
                                            }}>
                                                <FileText size={16} color="var(--color-primary)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {report.provider?.name || report.vendor || 'Proveedor Desconocido'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {report.vendor || 'Unknown Vendor'}
                                                    {report.vendor_nit && (
                                                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-primary)' }}>
                                                            NIT: {report.vendor_nit}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{report.client_name || '-'}</td>
                                    <td>
                                        <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                                            {report.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {formatCurrency(report.amount, report.currency)}
                                    </td>
                                    <td>{formatDate(report.created_at)}</td>
                                    <td>
                                        <span className={`badge ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => setSelectedReport(report)}
                                            title="Ver Detalle"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            className="btn-icon danger"
                                            onClick={() => handleDelete(report.id)}
                                            disabled={deletingId === report.id}
                                            title="Eliminar Reporte"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                        >
                                            {deletingId === report.id ? (
                                                <Loader size={18} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={18} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '2rem', position: 'relative' }}>
                        <button
                            onClick={() => setSelectedReport(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>Detalle de Transacción</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>ID Proveedor / Turno</label>
                                <p style={{ fontWeight: '500', fontSize: '1.1rem' }}>{selectedReport.provider_id || selectedReport.tour_id || 'N/A'}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Referencia</label>
                                <p style={{ fontWeight: '500', fontSize: '1.1rem' }}>{selectedReport.client_name || 'N/A'}</p>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Comercio (Vendor)</label>
                                <p style={{ fontWeight: '500' }}>{selectedReport.vendor || 'N/A'}</p>
                                {selectedReport.vendor_nit && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FileText size={12} />
                                        NIT: {selectedReport.vendor_nit}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Fecha</label>
                                <p style={{ fontWeight: '500' }}>{formatDate(selectedReport.created_at)}</p>
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Monto Total</label>
                                <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--color-success)' }}>
                                    {formatCurrency(selectedReport.amount, selectedReport.currency)}
                                </p>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Categoría: {selectedReport.category || 'Uncategorized'}</span>
                            </div>

                            {selectedReport.source_file_path && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Archivo Original</label>
                                    <p style={{ wordBreak: 'break-all', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                                        {selectedReport.source_file_path}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
