import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/FileUpload';

const NewReport = () => {
    const [loading, setLoading] = useState(false);

    // Nuevos campos para contexto
    const [tourId, setTourId] = useState('');
    const [clientName, setClientName] = useState('');
    const [sourceFilePath, setSourceFilePath] = useState('');

    // Datos extraídos por Gemini OCR
    const [extractedData, setExtractedData] = useState(null);
    const [ocrLoading, setOcrLoading] = useState(false);

    const [month, setMonth] = useState(10);
    const [year, setYear] = useState(2025);
    const [companyId, setCompanyId] = useState('demo-company-123');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { session } = useAuth();

    // Handler para cuando FileUpload completa el upload
    const handleUploadSuccess = (filePath, ocrData) => {
        setSourceFilePath(filePath);
        if (ocrData && !ocrData.error) {
            setExtractedData(ocrData);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. VALIDACIÓN DEL FRONTEND
        if (!tourId.trim() || !clientName.trim()) {
            setError('⚠️ Por favor, ingresa el Tour ID y el Nombre del Cliente para continuar.');
            return; // Detiene la ejecución aquí
        }

        if (!sourceFilePath) {
            setError('⚠️ Por favor, sube un archivo CSV o PDF para continuar.');
            return;
        }

        setLoading(true);

        const payload = {
            company_id: companyId,
            tour_id: tourId,      // Enviamos los nuevos datos
            client_name: clientName,
            month,
            year,
            source_file_path: sourceFilePath,
            extracted_data: extractedData // Incluimos los datos extraídos por Gemini
        };

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        try {
            const headers = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const res = await fetch(`${API_URL}/reports/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            setSuccess(`✅ Recibos procesados para ${clientName} (Tour: ${tourId}). ID: ${data.id}`);

            // Limpiar formulario opcionalmente
            // setTourId('');
            // setClientName('');

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <header className="page-header">
                <h1>Nuevo Reporte de Gastos</h1>
            </header>
            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    {/* SECCIÓN DE CONTEXTO (NUEVA) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="input-label">Tour ID *</label>
                            <input
                                type="text"
                                className="input-field" // Asegúrate de tener esta clase en tu CSS o usa estilos inline
                                value={tourId}
                                onChange={(e) => setTourId(e.target.value)}
                                placeholder="Ej: T-2025-001"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
                            />
                        </div>
                        <div>
                            <label className="input-label">Nombre del Cliente *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
                            />
                        </div>
                    </div>

                    <hr style={{ borderColor: 'var(--color-border)', opacity: 0.3 }} />

                    <div>
                        <label className="input-label">Archivo de Datos (CSV/PDF/JPG/PNG) *</label>
                        <FileUpload onUploadSuccess={handleUploadSuccess} />
                    </div>

                    {/* Mostrar datos extraídos por Gemini OCR */}
                    {extractedData && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '1rem'
                        }}>
                            <h3 style={{ color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '1rem' }}>Detalles detectados</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Comercio</label>
                                    <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{extractedData.vendor || 'N/A'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Fecha</label>
                                    <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{extractedData.date || 'N/A'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Monto</label>
                                    <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>
                                        {extractedData.currency || ''} ${extractedData.amount || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Categoría</label>
                                    <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{extractedData.category || 'N/A'}</p>
                                </div>
                            </div>
                            {extractedData.confidence_score && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                    Probabilidad de acierto: {(extractedData.confidence_score * 100).toFixed(0)}%
                                </p>
                            )}
                        </div>
                    )}

                    {/* Resto de campos (Fecha, Archivo, etc.) */}
                    <div>
                        <label className="input-label">Periodo</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
                            >
                                <option value={10}>Octubre</option>
                                <option value={11}>Noviembre</option>
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'white', border: '1px solid var(--color-border)' }}
                            >
                                <option value={2025}>2025</option>
                            </select>
                        </div>
                    </div>

                    {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>{error}</div>}

                    {success && <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>{success}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Procesando...' : 'Generar Reporte'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewReport;
