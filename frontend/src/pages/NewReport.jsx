import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import { saveReportOffline, syncOfflineReports } from '../utils/offlineManager';

const NewReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Nuevos campos para contexto
    const [tourId, setTourId] = useState('T-2025-001'); // Default for demo
    const [clientName, setClientName] = useState('');
    const [sourceFilePath, setSourceFilePath] = useState('');

    // Balance State
    const [tourBalance, setTourBalance] = useState({ budget: 0, advances: 0, collections: 0, expenses: 0, balance: 0 });
    const [budgetInput, setBudgetInput] = useState('');
    const [savingBudget, setSavingBudget] = useState(false);

    const [extractedData, setExtractedData] = useState(null);
    const [month, setMonth] = useState(10);
    const [year, setYear] = useState(2025);
    const [companyId, setCompanyId] = useState('demo-company-123');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { session } = useAuth();

    // Listen for connectivity changes
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const TOURISM_CATEGORIES = [
        { id: 'ANTICIPO_RECIBIDO', label: 'Anticipo', icon: '💰', color: 'from-green-400 to-emerald-600' },
        { id: 'RECAUDO_CLIENTE', label: 'Recaudo', icon: '💵', color: 'from-blue-400 to-cyan-600' }, // NEW
        { id: '🍽️ Restaurante', label: 'Restaurante', icon: '🍽️', color: 'from-orange-400 to-red-500' },
        { id: '🎟️ Atractivo', label: 'Atractivo', icon: '🎟️', color: 'from-purple-400 to-indigo-500' },
        { id: '🍿 Snack', label: 'Snack', icon: '🍿', color: 'from-yellow-400 to-orange-500' },
        { id: '📦 Otros', label: 'Otros', icon: '📦', color: 'from-gray-400 to-gray-600' }
    ];

    // Fetch Balance when TourID changes
    React.useEffect(() => {
        if (tourId && session?.access_token) {
            fetchBalance();
        }
    }, [tourId, session]);

    const fetchBalance = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/summary?tour_id=${tourId}`, {
                headers: { "Authorization": `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTourBalance({
                    budget: data.budget || 0,
                    advances: data.total_advances,
                    collections: data.total_collections || 0,
                    expenses: data.total_expenses,
                    balance: data.balance
                });
                // Sync input if budget exists
                if (data.budget) setBudgetInput(data.budget.toString());
            }
        } catch (err) {
            console.error("Error fetching balance", err);
        }
    };

    const handleSaveBudget = async () => {
        if (!budgetInput || isNaN(budgetInput)) return;
        setSavingBudget(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/budget`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    tour_id: tourId,
                    category: "TOTAL",
                    budget_amount: parseFloat(budgetInput)
                })
            });
            if (res.ok) {
                fetchBalance();
            }
        } catch (err) {
            console.error("Error saving budget", err);
        } finally {
            setSavingBudget(false);
        }
    };

    const [selectedCategory, setSelectedCategory] = useState(null);

    // Handler para cuando FileUpload completa el upload
    const handleUploadSuccess = (filePath, ocrData) => {
        setSourceFilePath(filePath);
        if (ocrData && !ocrData.error) {
            setExtractedData(ocrData);
            // Pre-seleccionar categoría si la IA lo sugiere y coincide con nuestras nuevas categorías
            if (ocrData.category) {
                const match = TOURISM_CATEGORIES.find(c => c.id === ocrData.category || c.label === ocrData.category);
                if (match) setSelectedCategory(match.id);
                else setSelectedCategory('📦 Otros'); // Fallback a Otros si no coincide
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. VALIDACIÓN DEL FRONTEND
        if (!tourId.trim() || !clientName.trim()) {
            setError('⚠️ Por favor, ingresa el Tour ID y el Nombre del Cliente para continuar.');
            return;
        }

        if (!sourceFilePath) {
            setError('⚠️ Por favor, sube un archivo para continuar.');
            return;
        }

        if (!selectedCategory) {
            setError('⚠️ Por favor, selecciona una categoría (confirmación manual).');
            return;
        }

        setLoading(true);

        const payload = {
            company_id: companyId,
            tour_id: tourId,
            client_name: clientName,
            month,
            year,
            source_file_path: sourceFilePath,
            extracted_data: extractedData,
            category: selectedCategory // Enviamos la categoría seleccionada manualmente
        };

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

        try {
            if (!isOnline) {
                const saved = saveReportOffline(payload);
                if (saved) {
                    setSuccess('📡 Guardado en local. Se subirá automáticamente cuando vuelvas a tener internet.');
                    // Reset UI
                    setSelectedCategory(null);
                    setExtractedData(null);
                    setSourceFilePath('');
                } else {
                    setError('❌ Error al guardar localmente.');
                }
                setLoading(false);
                return;
            }

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
            setSuccess(`✅ Reporte enviado con éxito. ID: ${data.id}`);

            // AUTO-RESET FORM AFTER 3 SECONDS
            setTimeout(() => {
                setSuccess('');
                setSelectedCategory(null);
                setExtractedData(null);
                setSourceFilePath(''); // This triggers FileUpload to reset if bound correctly, or we might need a key to force re-render
                // Note: tourId and clientName remains for continuous entry
            }, 3000);

            // ACTUALIZAR SALDO DESPUÉS DE ENVIAR (Optimistic Update ideal, pero fetch es seguro)
            fetchBalance();

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-content"
        >
            <header className="page-header">
                <h1>Nuevo Reporte de Gastos</h1>
            </header>
            <motion.div
                className="glass-card"
                style={{ maxWidth: '700px', padding: '2rem' }}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
            >

                {/* OFFLINE INDICATOR */}
                {!isOnline && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#fca5a5',
                            fontSize: '0.9rem'
                        }}
                    >
                        <WifiOff size={18} />
                        <span>Modo Offline: Tus reportes se guardarán localmente y se subirán al recuperar señal.</span>
                    </motion.div>
                )}

                {/* 1. CONFIGURACIÓN DEL TOUR */}
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        alignItems: 'flex-end'
                    }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Tour ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={tourId}
                                onChange={(e) => setTourId(e.target.value)}
                                placeholder="Eje: T-2025-001"
                                style={{ background: 'rgba(0,0,0,0.2)', width: '100%' }}
                            />
                        </div>
                        <div style={{ flex: '1 1 300px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Monto Asignado (Budget)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={budgetInput}
                                    onChange={(e) => setBudgetInput(e.target.value)}
                                    placeholder="Total entregado"
                                    style={{ background: 'rgba(0,0,0,0.2)', flex: 1 }}
                                />
                                <button
                                    onClick={handleSaveBudget}
                                    disabled={savingBudget || !tourId}
                                    className="btn-premium"
                                    style={{
                                        padding: '0 1.5rem',
                                        height: '42px',
                                        fontSize: '0.85rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {savingBudget ? '...' : 'Fijar'}
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Cliente</label>
                            <input
                                type="text"
                                className="form-input"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nombre cliente"
                                style={{ background: 'rgba(0,0,0,0.2)', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. SUMMARY WIDGET (Responsabilidad) */}
                <div className="glass-card" style={{
                    padding: '1.25rem',
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    borderLeft: '4px solid #10b981',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 'bold' }}>
                                Responsabilidad Total (COP)
                            </h3>
                            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: 'white' }}>
                                $ {tourBalance.balance?.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                                Dinero que aún debes legalizar o devolver.
                            </div>

                            {/* BUDGET ALERT */}
                            {tourBalance.budget > 0 && tourBalance.expenses > (tourBalance.budget * 0.9) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        marginTop: '10px',
                                        padding: '4px 10px',
                                        background: 'rgba(245, 158, 11, 0.2)',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '6px',
                                        color: '#fbbf24',
                                        fontSize: '0.7rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontWeight: '600'
                                    }}
                                >
                                    <AlertTriangle size={14} />
                                    OJO: Has usado el {(tourBalance.expenses / tourBalance.budget * 100).toFixed(0)}% del presupuesto.
                                </motion.div>
                            )}
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', gap: '1.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ingresos</div>
                                <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.1rem' }}>+ $ {(tourBalance.budget + tourBalance.collections).toLocaleString()}</div>
                            </div>
                            <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Gastos</div>
                                <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '1.1rem' }}>- $ {tourBalance.expenses?.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '-1rem', marginBottom: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={() => navigate(`/tour-closure/${tourId || ''}`)}
                        className="btn-secondary"
                        style={{
                            fontSize: '0.8rem', padding: '0.5rem 1rem',
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(255,255,255,0.05)'
                        }}
                    >
                        🏁 Finalizar y Cerrar Tour
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                        <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>1. Sube tu Recibo (Foto o PDF)</label>
                        <FileUpload key={sourceFilePath || 'empty'} onUploadSuccess={handleUploadSuccess} />
                    </motion.div>

                    <AnimatePresence>
                        {(sourceFilePath || selectedCategory) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label className="input-label" style={{ marginBottom: '1rem', display: 'block', color: 'var(--color-accent)' }}>
                                    2. Confirma la Categoría (One-Touch)
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '1rem',
                                    marginTop: '0.5rem'
                                }}>
                                    {TOURISM_CATEGORIES.map((cat) => (
                                        <motion.button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: 'var(--radius-lg)',
                                                border: `2px solid ${selectedCategory === cat.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)'}`,
                                                background: selectedCategory === cat.id
                                                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.4) 100%)'
                                                    : 'rgba(30, 41, 59, 0.4)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: selectedCategory === cat.id
                                                    ? '0 0 20px rgba(245, 158, 11, 0.3)'
                                                    : '0 4px 6px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{cat.icon}</span>
                                            <span style={{ fontSize: '1rem', fontWeight: '600', letterSpacing: '0.02em' }}>{cat.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mostrar datos extraídos por Gemini OCR */}
                    <AnimatePresence>
                        {extractedData && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{
                                    padding: '1.5rem',
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ color: 'var(--color-success)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✨</span> IA Detectó:
                                    </h3>
                                    {extractedData.confidence_score && (
                                        <span style={{
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#6ee7b7',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {(extractedData.confidence_score * 100).toFixed(0)}% Confianza
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Comercio</label>
                                        <p style={{ margin: '0.25rem 0', fontWeight: '600', fontSize: '1.1rem' }}>{extractedData.vendor || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Monto</label>
                                        <p style={{ margin: '0.25rem 0', fontWeight: '600', fontSize: '1.1rem', fontFamily: 'monospace' }}>
                                            {extractedData.currency || ''} ${extractedData.amount || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>IA Sugirió</label>
                                        <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{extractedData.category || 'N/A'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: '#fca5a5' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', color: '#6ee7b7', textAlign: 'center', fontWeight: 'bold' }}
                        >
                            {success}
                        </motion.div>
                    )}

                    <motion.button
                        type="submit"
                        className="btn-premium"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                    >
                        {loading ? 'Procesando...' : '🚀 Enviar Reporte'}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default NewReport;
