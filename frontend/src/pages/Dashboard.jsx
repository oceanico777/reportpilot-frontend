import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusCircle,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3,
    DollarSign,
    ArrowUpRight,
    Briefcase,
    Calendar,
    RefreshCw,
    Wifi
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getPendingReports, syncOfflineReports } from '../utils/offlineManager';

const Dashboard = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState({
        // Mock data now reflects Restaurant Context
        total_reports: 124,
        total_spent: 45600000,
        monthly_stats: [
            { month: 'Ene', total: 3200000 },
            { month: 'Feb', total: 4100000 },
            { month: 'Mar', total: 3800000 },
            { month: 'Abr', total: 5200000 },
            { month: 'May', total: 4900000 },
            { month: 'Jun', total: 6100000 },
        ],
        client_stats: [
            { name: 'Surtifruver', value: 15000000 },
            { name: 'Carnecol', value: 12000000 },
            { name: 'Lacteos del Valle', value: 8000000 },
            { name: 'Makro', value: 6000000 },
            { name: 'Plaza de Mercado', value: 4600000 },
        ],
        recent_activity: [
            { id: 1, tour_id: 'COMPRA-001', created_at: '2025-10-15', amount: 120000, category: 'Pulpas de Fruta' },
            { id: 2, tour_id: 'COMPRA-002', created_at: '2025-10-14', amount: 45000, category: 'Verduras' },
            { id: 3, tour_id: 'COMPRA-003', created_at: '2025-10-13', amount: 890000, category: 'Carnes' },
            { id: 4, tour_id: 'COMPRA-004', created_at: '2025-10-12', amount: 230000, category: 'Lacteos' },
        ],
        category_stats: [
            { name: '🍓 Pulpas', value: 8400000 },
            { name: '🥔 Papa Criolla', value: 4200000 },
            { name: '🥕 Zanahorias', value: 3100000 },
            { name: '🥛 Leche', value: 5500000 },
            { name: '💧 Botellones Agua', value: 2500000 },
            { name: '🍟 Papa Pastusa', value: 3800000 },
        ]
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: null, end: null, label: 'Todo' });
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        setPendingCount(getPendingReports().length);
    }, []);

    useEffect(() => {
        if (session?.access_token) {
            fetchDashboardStats();
        }
    }, [session, dateRange]);

    const handleSync = async () => {
        if (syncing || pendingCount === 0) return;
        setSyncing(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
        await syncOfflineReports(session, API_URL);
        setPendingCount(getPendingReports().length);
        fetchDashboardStats();
        setSyncing(false);
    };

    const fetchDashboardStats = async () => {
        try {
            // Only show loader on initial load or if we want to blocking-load
            // setLoading(true); 
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

            let queryParams = '';
            if (dateRange.start && dateRange.end) {
                queryParams = `?start_date=${dateRange.start}&end_date=${dateRange.end}`;
            }

            const res = await fetch(`${API_URL}/reports/dashboard-stats${queryParams}`, {
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

    const [priceTrendData, setPriceTrendData] = useState([]);
    const [trendProduct, setTrendProduct] = useState('Papa'); // Default
    const TREND_PRODUCTS = ['Papa', 'Carne', 'Tomate', 'Aceite', 'Leche', 'Arroz'];

    useEffect(() => {
        if (session?.access_token) {
            fetchPriceTrends();
        }
    }, [session, trendProduct]);

    const fetchPriceTrends = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/reports/price-trends?query=${trendProduct}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPriceTrendData(data);
            }
        } catch (err) {
            console.error("Error fetching price trends", err);
        }
    };

    const handleDateFilter = (rangeType) => {
        const now = new Date();
        let start = null;
        let end = new Date(); // Today

        // ... (rest of logic unchanged)

        if (rangeType === 'month') {
            // First day of current month
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (rangeType === 'quarter') {
            // Last 3 months
            start = new Date();
            start.setMonth(now.getMonth() - 2);
            start.setDate(1); // Start from 1st of that month
        } else if (rangeType === 'year') {
            // First day of current year
            start = new Date(now.getFullYear(), 0, 1);
        } else {
            // All time
            start = null;
            end = null;
        }

        // Format to YYYY-MM-DD (local time)
        // Note: toISOString uses UTC. Using local components is safer for dates.
        const formatDate = (date) => {
            if (!date) return null;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setDateRange({
            start: formatDate(start),
            end: formatDate(end),
            label: rangeType
        });
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '-';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--color-border)',
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
                }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>{label}</p>
                    <p style={{ color: '#fff', fontWeight: '600' }}>
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading && !stats.total_reports) { // Only blocking loader initially
        return (
            <div className="flex-center" style={{ height: '80vh' }}>
                <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            </div>
        );
    }

    // Colors/Styles for active buttons
    const getButtonStyle = (active) => ({
        background: active ? 'var(--color-surface-hover)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text-muted)',
        border: 'none',
        padding: '6px 12px',
        fontSize: '0.85rem',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
    });

    return (
        <div className="page-content" style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
            <header className="page-header" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block', letterSpacing: '-0.03em' }}>
                        Dashboard v1.1.12
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>Visión en tiempo real de tus finanzas</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Sync Button */}
                    {pendingCount > 0 && (
                        <button
                            onClick={handleSync}
                            className="glass-card"
                            style={{
                                padding: '0.75rem 1rem',
                                border: '1px solid #10b981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#6ee7b7',
                                transition: 'all 0.3s'
                            }}
                        >
                            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                            <span>Sincronizar ({pendingCount})</span>
                        </button>
                    )}

                    {/* Date Filters */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(30, 41, 59, 0.5)',
                        padding: '4px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        backdropFilter: 'blur(4px)',
                        overflowX: 'auto',
                        maxWidth: '100%',
                        WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
                        scrollbarWidth: 'none', // Hide scrollbar Firefox
                        msOverflowStyle: 'none' // Hide scrollbar IE
                    }}>
                        {/* Hide scrollbar Chrome/Safari */}
                        <style>{`
                            div::-webkit-scrollbar { display: none; }
                        `}</style>
                        <button
                            onClick={() => handleDateFilter('all')}
                            style={{ ...getButtonStyle(dateRange.label === 'all'), whiteSpace: 'nowrap' }}>
                            Todo
                        </button>
                        <button
                            onClick={() => handleDateFilter('year')}
                            style={{ ...getButtonStyle(dateRange.label === 'year'), whiteSpace: 'nowrap' }}>
                            Este Año
                        </button>
                        <button
                            onClick={() => handleDateFilter('quarter')}
                            style={{ ...getButtonStyle(dateRange.label === 'quarter'), whiteSpace: 'nowrap' }}>
                            Últ. 3 Meses
                        </button>
                        <button
                            onClick={() => handleDateFilter('month')}
                            style={{ ...getButtonStyle(dateRange.label === 'month'), whiteSpace: 'nowrap' }}>
                            Este Mes
                        </button>
                    </div>

                    <Link to="/new">
                        <button className="btn-premium" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                            <PlusCircle size={20} />
                            <span>Nuevo</span>
                        </button>
                    </Link>
                </div>
            </header>

            {/* KPI GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Total Spent Card */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
                        <DollarSign size={80} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                            <TrendingUp size={24} />
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: '500' }}>Costo Operativo de Insumos</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                        {formatCurrency(stats.total_spent)}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={16} />
                        <span>
                            {dateRange.label === 'all' ? 'Histórico Completo' :
                                dateRange.label === 'month' ? 'Este Mes' :
                                    dateRange.label === 'year' ? 'Este Año' : 'Últimos 90 Días'}
                        </span>
                    </div>
                </div>

                {/* Total Reports Card */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                            <PieChartIcon size={24} />
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: '500' }}>Total Facturas</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                        {stats.total_reports}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        Facturas procesadas
                    </div>
                </div>

                {/* Top Category Card */}
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                            <BarChart3 size={24} />
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: '500' }}>Mayor Categoría</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-heading)' }}>
                        {stats?.category_stats && stats.category_stats.length > 0
                            ? stats.category_stats.reduce((max, current) => ((current?.value || 0) > (max?.value || 0) ? current : max), stats.category_stats[0] || {}).name
                            : '-'}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                        Tendencia principal
                    </div>
                </div>
            </div>

            {/* ACTIVE TOUR BUDGET BAR */}
            {stats.active_tour && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                                <Briefcase size={20} />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Caja Menor: <span style={{ color: '#10b981' }}>{stats.active_tour.tour_id || 'Semanal'}</span></h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Estado Actual: </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: stats.active_tour.remaining < 0 ? '#ef4444' : '#10b981' }}>
                                {stats.active_tour.remaining < 0 ? 'Excedido' : formatCurrency(stats.active_tour.remaining)}
                            </span>
                        </div>
                    </div>

                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{
                            height: '100%',
                            width: `${stats.active_tour.progress}%`,
                            background: stats.active_tour.progress > 90 ? 'linear-gradient(90deg, #f87171, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: '6px',
                            transition: 'width 1s ease-in-out',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <span>Gastado: <span style={{ color: '#fff' }}>{formatCurrency(stats.active_tour.total_spent)}</span></span>
                        <span>Presupuesto: <span style={{ color: '#fff' }}>{formatCurrency(stats.active_tour.total_budget)}</span></span>
                    </div>
                </div>
            )}

            {/* CHARTS GRID - Responsive Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

                {/* Main Bar Chart - Monthly */}
                <div style={{ gridColumn: 'span 12' }} className="lg:col-span-8">
                    <div className="glass-card" style={{ padding: '1.5rem', height: '100%', minHeight: '350px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)' }}>Evolución de Costos</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.monthly_stats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000000}M`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="total" fill="url(#colorTotal)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Price Trend Chart - New Feature */}
                <div style={{ gridColumn: 'span 12' }} className="lg:col-span-12">
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={24} className="text-emerald-400" />
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: 0 }}>
                                    Rastreador de Precios: <span className="text-emerald-400">{trendProduct}</span>
                                </h3>
                            </div>
                            <select
                                value={trendProduct}
                                onChange={(e) => setTrendProduct(e.target.value)}
                                className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-1"
                            >
                                {TREND_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div style={{ height: '250px', width: '100%' }}>
                            {priceTrendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={priceTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                                        <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex-center h-full text-slate-500">
                                    <p>No hay datos suficientes para {trendProduct} aún.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Donut Chart - Categories */}
                <div style={{ gridColumn: 'span 12' }} className="lg:col-span-4">
                    <div className="glass-card" style={{ padding: '1.5rem', height: '100%', minHeight: '350px' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Insumos Principales</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.category_stats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.category_stats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horizontal Bar Chart - Top Clients */}
                <div style={{ gridColumn: 'span 12' }} className="lg:col-span-6">
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                            <Briefcase size={20} color="var(--color-primary)" />
                            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', margin: 0 }}>Top Proveedores</h3>
                        </div>
                        {stats.client_stats && stats.client_stats.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.client_stats.map((client, index) => (
                                    <div key={index} style={{ marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                                            <span style={{ color: 'var(--color-text-main)' }}>{client.name}</span>
                                            <span style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{formatCurrency(client.value)}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${(client.value / stats.client_stats[0].value) * 100}%`,
                                                height: '100%',
                                                background: COLORS[index % COLORS.length],
                                                borderRadius: '4px'
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)' }}>Sin datos de clientes.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div style={{ gridColumn: 'span 12' }} className="lg:col-span-6">
                    <div className="glass-card" style={{ padding: '1.5rem', height: '100%' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Actividad Reciente</h3>
                        <div className="table-container" style={{ marginTop: '0.5rem' }}>
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', paddingBottom: '0.8rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PROVEEDOR / REF</th>
                                        <th style={{ textAlign: 'right', paddingBottom: '0.8rem', color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MONTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_activity.map((report) => (
                                        <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem 0' }}>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{report.tour_id || 'N/A'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-text-main)', fontFamily: 'monospace', fontSize: '1rem' }}>
                                                {formatCurrency(report.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
