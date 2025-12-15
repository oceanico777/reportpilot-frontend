import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle, Loader } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState({
        total_reports: 0,
        monthly_stats: [],
        recent_activity: [],
        category_stats: []
    });
    const [loading, setLoading] = useState(true);

    // --- 1. FETCH DATA ---
    useEffect(() => {
        if (session?.access_token) {
            fetchDashboardStats();
        }
    }, [session]);

    const fetchDashboardStats = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/reports/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. SIMULACIÓN DE PRESUPUESTO (Mantener visualmente por ahora) ---
    const TOTAL_BUDGET = 10000000; // $10,000,000 COP
    const CONSUMED_AMOUNT = 4500000; // Simulación
    const consumedPercentage = (CONSUMED_AMOUNT / TOTAL_BUDGET) * 100;

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '-';
        return amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <Loader className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
        );
    }

    return (
        <div className="page-content">
            <header className="page-header">
                <div>
                    <h1>Resumen</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Panorama general de tu actividad</p>
                </div>
                <Link to="/new">
                    <button className="btn-primary">
                        <PlusCircle size={18} />
                        <span>Nuevo Gasto</span>
                    </button>
                </Link>
            </header>

            <div className="stats-grid">
                <div className="card stat-card">
                    <h3>Reportes Total</h3>
                    <p className="stat-value">{stats.total_reports}</p>
                </div>
            </div>

            {/* GRÁFICOS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                {/* 1. PIE CHART (Expense Distribution) */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Distribución de Gastos</h2>
                    {stats.category_stats && stats.category_stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={stats.category_stats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.category_stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '8px', color: 'var(--color-text)' }}
                                />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)' }}>Sin datos de categorías.</p>
                    )}
                </div>

                {/* 2. LINE CHART (Monthly Activity) */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Reportes Mensuales</h2>
                    {stats.monthly_stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={stats.monthly_stats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '0.75rem' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '0.75rem' }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '8px', color: 'var(--color-text)' }} />
                                <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)' }}>No hay datos suficientes aún.</p>
                    )}
                </div>
            </div>

            {/* TABLA DE APROBACIONES (USER ASKED FOR 'PENDING REVIEW' CONTEXT, BUT WE ARE SHOWING RECENT FOR NOW) */}
            <div className="recent-activity" style={{ marginTop: '2rem' }}>
                <h2>Actividad Reciente</h2>
                <div className="card table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tour / Descripción</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_activity.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <div style={{ fontWeight: '500' }}>{report.tour_id || 'Sin Tour ID'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{report.summary_text?.substring(0, 30) || '...'}</div>
                                    </td>
                                    <td>{formatDate(report.created_at)}</td>
                                    <td>{formatCurrency(report.amount)}</td>
                                    <td>
                                        <span className={`badge ${report.status === 'SENT' ? 'success' : 'default'}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
