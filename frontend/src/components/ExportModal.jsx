import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ExportModal = ({ isOpen, onClose }) => {
    const { session } = useAuth();
    const [format, setFormat] = useState('pdf');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const queryParams = new URLSearchParams({ format });
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);

            const response = await fetch(`${API_URL}/exports/gastos?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Export failed');

            // Handle Blob download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = format === 'pdf' ? 'pdf' : 'xlsx';
            a.download = `Gastos_Export_${new Date().toISOString().slice(0, 10)}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            onClose();
        } catch (error) {
            console.error("Download error:", error);
            alert("Hubo un error al generar el archivo. Por favor intenta de nuevo.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                padding: '2rem',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                border: '1px solid var(--color-border)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Download size={20} />
                        Exportar Gastos
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Genera un archivo limpio y organizado, listo para enviar a tu contador.
                </p>

                {/* Date Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Desde</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Hasta</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem', borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'
                            }}
                        />
                    </div>
                </div>

                {/* Format Selection */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Formato</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div
                            onClick={() => setFormat('pdf')}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '8px',
                                border: `2px solid ${format === 'pdf' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                cursor: 'pointer', textAlign: 'center',
                                backgroundColor: format === 'pdf' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FileText size={24} color={format === 'pdf' ? 'var(--color-primary)' : 'var(--color-text-muted)'} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>PDF</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Para impresión</div>
                        </div>

                        <div
                            onClick={() => setFormat('xlsx')}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '8px',
                                border: `2px solid ${format === 'xlsx' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                cursor: 'pointer', textAlign: 'center',
                                backgroundColor: format === 'xlsx' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <FileSpreadsheet size={24} color={format === 'xlsx' ? 'var(--color-primary)' : 'var(--color-text-muted)'} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>Excel</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Para contabilidad</div>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
                >
                    {downloading ? (
                        <>Generando...</>
                    ) : (
                        <>
                            <Download size={18} style={{ marginRight: '8px' }} />
                            Descargar Archivo
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ExportModal;
