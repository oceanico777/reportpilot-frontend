import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Calendar, Info, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Planning = () => {
    const { session } = useAuth();
    const [statData, setStatData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.access_token) {
            fetchPrediction();
        }
    }, [session]);

    const fetchPrediction = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/prediction`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStatData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <Loader className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
        );
    }

    if (!statData || statData.sample_size === 0) {
        return (
            <div className="page-content">
                <header className="page-header">
                    <h1>Proyecciones</h1>
                </header>
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Calculator size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <h3>Datos insuficientes</h3>
                    <p>Necesitamos más historial de tours (con Tour ID) para generar predicciones.</p>
                </div>
            </div>
        );
    }

    const chartData = Object.entries(statData.by_category).map(([name, value]) => ({ name, value }));

    return (
        <div className="page-content">
            <header className="page-header">
                <div>
                    <h1>Proyecciones</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Estimaciones basadas en {statData.sample_size} tours históricos</p>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Main Cost Card */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Costo Promedio por Tour</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {formatCurrency(statData.average_total)}
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                Valor esperado para futuras operaciones similares.
                            </p>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                            <TrendingUp size={32} color="var(--color-primary)" />
                        </div>
                    </div>
                </div>

                {/* Breakdown Card */}
                <div className="card" style={{ gridColumn: 'span 1', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Distribución Estimada</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Details List */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Desglose por Categoría</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chartData.sort((a, b) => b.value - a.value).map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span>{item.name}</span>
                                </div>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Planning;
