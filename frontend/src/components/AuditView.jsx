import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Check, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuditView = ({ report, onClose, onUpdate }) => {
    const { session } = useAuth();
    const [zoom, setZoom] = useState(1);
    const [status, setStatus] = useState(report.status || 'PENDING');
    const [saving, setSaving] = useState(false);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

    const handleStatusChange = async (action) => {
        setSaving(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const endpoint = action === 'APPROVED' ? 'approve' : 'reject';
            const res = await fetch(`${API_URL}/reports/${report.id}/${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (res.ok) {
                const updatedReport = await res.json();
                setStatus(updatedReport.status);
                onUpdate(report.id, updatedReport.status);
                onClose();
            } else {
                alert("Error updating status");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };


    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                background: '#1e293b', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #334155'
            }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                    Auditoría de Recibo: {report.id.slice(0, 8)} | Tour: {report.tour_id}
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Split Content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* LEFT: FORM DATA */}
                <div style={{ width: '350px', background: '#0f172a', padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid #334155' }}>
                    {report.is_duplicate && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            color: '#ef4444',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <XCircle size={16} /> Posible Duplicado detectado
                            </div>
                            Este recibo coincide con otro guardado anteriormente (Mismo vendedor y monto).
                        </div>
                    )}
                    <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Datos del Reporte</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Vendor</label>
                        <input type="text" readOnly value={report.vendor || ''} className="form-input" style={{ width: '100%', background: '#1e293b', borderColor: '#334155' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Amount</label>
                        <input type="text" readOnly value={report.amount || ''} className="form-input" style={{ width: '100%', background: '#1e293b', borderColor: '#334155' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Category</label>
                        <input type="text" readOnly value={report.category || ''} className="form-input" style={{ width: '100%', background: '#1e293b', borderColor: '#334155' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Date</label>
                        <input type="text" readOnly value={report.created_at?.split('T')[0] || ''} className="form-input" style={{ width: '100%', background: '#1e293b', borderColor: '#334155' }} />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Current Status</label>
                        <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800',
                            background: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: status === 'APPROVED' ? '#10b981' : status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${status === 'APPROVED' ? '#10b981' : status === 'REJECTED' ? '#ef4444' : '#f59e0b'}`
                        }}>
                            {status.replace('_', ' ')}
                        </span>
                    </div>


                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            onClick={() => handleStatusChange("REJECTED")}
                            disabled={saving}
                            className="btn-secondary"
                            style={{ borderColor: '#ef4444', color: '#ef4444', justifyContent: 'center' }}
                        >
                            <XCircle size={18} style={{ marginRight: '8px' }} /> Rechazar
                        </button>
                        <button
                            onClick={() => handleStatusChange("APPROVED")}
                            disabled={saving}
                            className="btn-primary"
                            style={{ background: '#10b981', justifyContent: 'center' }}
                        >
                            <Check size={18} style={{ marginRight: '8px' }} /> Aprobar
                        </button>
                    </div>
                </div>

                {/* RIGHT: IMAGE VIEWER */}
                <div style={{ flex: 1, background: '#334155', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Toolbar */}
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '8px', zIndex: 10 }}>
                        <button onClick={handleZoomOut} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', padding: '8px', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
                            <ZoomOut size={20} />
                        </button>
                        <button onClick={handleZoomIn} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', padding: '8px', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
                            <ZoomIn size={20} />
                        </button>
                    </div>

                    {report.file_url ? (
                        <div style={{
                            transform: `scale(${zoom})`,
                            transition: 'transform 0.2s ease-out',
                            maxWidth: '100%', maxHeight: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {report.file_url.toLowerCase().endsWith('.pdf') ? (
                                <embed src={report.file_url} type="application/pdf" width="600" height="800" />
                            ) : (
                                <img
                                    src={report.file_url}
                                    alt="Evidence"
                                    style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ color: '#94a3b8' }}>No evidence file available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditView;
