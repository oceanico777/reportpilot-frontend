import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, PenTool, Eraser } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TourClosure = () => {
    const { tourId } = useParams();
    const navigate = useNavigate();
    const { session } = useAuth();

    // State
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Signature Canvas
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // 1. Fetch Summary Data on Mount
    useEffect(() => {
        fetchSummary();
    }, [tourId, session]);

    const fetchSummary = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/summary?tour_id=${tourId}`, {
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            } else {
                setError("No se pudo cargar la información del tour.");
            }
        } catch (err) {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    // 2. Canvas Drawing Logic (Mouse & Touch)
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    // 3. Submit Closure
    const handleCloseTour = async () => {
        if (!hasSignature) {
            setError("⚠️ Debes firmar para cerrar el tour.");
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const canvas = canvasRef.current;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const formData = new FormData();
            formData.append('signature', blob, 'signature.png');

            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/tours/${tourId}/close`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${session?.access_token}` },
                body: formData // Content-Type is auto-set
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Error al cerrar el tour.");
            }

            const data = await res.json();
            setSuccess(true);

        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    // Helper: Logic for Balance Color
    const getBalanceInfo = () => {
        if (!summary) return { text: "Calculando...", color: "#94a3b8" };
        const bal = summary.balance; // Ensure logic matches backend
        if (bal > 0) return { text: "DEBES REINTEGRAR A LA AGENCIA", color: "#ef4444" };
        if (bal < 0) return { text: "LA AGENCIA DEBE REEMBOLSARTE", color: "#3b82f6" };
        return { text: "PAZ Y SALVO (Saldo $0)", color: "#10b981" };
    };

    if (success) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '1rem' }}>Tour Cerrado Exitosamente</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Generamos tu Acta de Liquidación y la enviamos a contabilidad. Ya no puedes editar este tour.</p>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-content">
            <header className="page-header">
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1>Cierre Digital de Tour</h1>
            </header>

            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <XCircle size={20} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos financieros...</div>
                ) : (
                    <>
                        <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Resumen Final</h2>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Tour Ref: <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{tourId}</span></div>

                        {/* FINANCIAL SUMMARY BOX */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <span>(+) Total Anticipos:</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(summary.total_advances)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <span>(+) Total Recaudos:</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(summary.total_collections || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <span>(-) Total Gastos:</span>
                                <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(summary.total_expenses)}</span>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.2rem' }}>Resultado de Liquidación</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: getBalanceInfo().color }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(summary.balance)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: getBalanceInfo().color, fontWeight: '600', marginTop: '0.2rem' }}>
                                    {getBalanceInfo().text}
                                </div>
                            </div>
                        </div>

                        {/* SIGNATURE SECTION */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <PenTool size={18} /> Firma del Guía
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.4' }}>
                                Declaro bajo gravedad de juramento que los gastos reportados son legítimos y corresponden a la operación del tour. Acepto el balance resultante.
                            </p>

                            <div style={{
                                border: hasSignature ? '2px solid #10b981' : '2px dashed #475569',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#fff', // White background for signature
                                height: '200px',
                                position: 'relative',
                                touchAction: 'none' // Prevent scrolling while signing
                            }}>
                                <canvas
                                    ref={canvasRef}
                                    width={600} // Internal resolution
                                    height={200}
                                    style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!hasSignature && (
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                                        Firma Aquí
                                    </div>
                                )}
                                <button
                                    onClick={clearSignature}
                                    style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%',
                                        padding: '5px', cursor: 'pointer', color: '#64748b'
                                    }}
                                    title="Limpiar firma"
                                >
                                    <Eraser size={16} />
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{
                                width: '100%', padding: '1.2rem', fontSize: '1.1rem',
                                opacity: submitting ? 0.7 : 1,
                                background: 'linear-gradient(to right, #10b981, #059669)',
                                border: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                            }}
                            disabled={submitting}
                            onClick={handleCloseTour}
                        >
                            {submitting ? 'Procesando Cierre...' : 'Firmar y Cerrar Tour'}
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default TourClosure;
