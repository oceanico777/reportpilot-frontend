import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/FileUpload';

const NewReport = () => {
    const [loading, setLoading] = useState(false);

    // Nuevos campos para contexto
    const [tourId, setTourId] = useState('');
    const [clientName, setClientName] = useState('');
    const [sourceFilePath, setSourceFilePath] = useState('');

    const [month, setMonth] = useState(10);
    const [year, setYear] = useState(2025);
    const [companyId, setCompanyId] = useState('demo-company-123');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { session } = useAuth();

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
            source_file_path: sourceFilePath
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

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setSuccess(`✅ Recibos procesados para ${clientName} (Tour: ${tourId}). ID: ${data.id}`);

            // Limpiar formulario opcionalmente
            // setTourId('');
            // setClientName('');

        } catch (err) {
            console.error('Error:', err);
            setError('Error al procesar. Verifica que el backend esté activo.');
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
                        <FileUpload onUploadSuccess={setSourceFilePath} />
                    </div>

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
                        {loading ? 'Analizando con IA...' : 'Procesar Recibos'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewReport;
