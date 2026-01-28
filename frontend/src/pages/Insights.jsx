import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';

const Insights = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState({
        byCategory: [],
        byProvider: [],
        providerTrends: []
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';

            // Parallel Fetch
            const [reportsRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/purchases/?limit=200`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
                fetch(`${API_URL}/reports/provider-trends`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            ]);

            const purchasesData = await reportsRes.json();
            const trendsData = await trendsRes.json();

            processData(purchasesData, trendsData);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDownloadExcel = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${API_URL}/exports/providers-excel`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Gastos_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Error al descargar el reporte");
            }
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const processData = (purchasesData, trendsData) => {
        // 1. Category Data
        const categoryMap = {};
        const providerMap = {};

        purchasesData.forEach(p => {
            const amount = p.amount || 0;
            const category = p.category || 'Sin Categoría';
            const provider = p.provider?.name || p.vendor || 'Varios / Otros';

            if (amount > 0) {
                categoryMap[category] = (categoryMap[category] || 0) + amount;
                providerMap[provider] = (providerMap[provider] || 0) + amount;
            }
        });

        const byCategory = Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key]
        }));

        const byProvider = Object.keys(providerMap)
            .map(key => ({
                name: key,
                value: providerMap[key]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 providers for pie clarity

        setStats({
            byCategory,
            byProvider,
            providerTrends: trendsData
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getMaxCategory = (data) => {
        if (!data || data.length === 0) return '';
        const max = data.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        return max.name;
    };

    const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#A78BFA'];
    const LINE_COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

    // Get unique provider keys for lines (excluding 'month')
    const getProviderKeys = (data) => {
        if (!data || data.length === 0) return [];
        const keys = new Set();
        data.forEach(item => Object.keys(item).forEach(k => {
            if (k !== 'month') keys.add(k);
        }));
        return Array.from(keys);
    };

    const providerKeys = getProviderKeys(stats.providerTrends);



    return (
        <div className="page-content">
            <header className="page-header flex justify-between items-center">
                <h1>Analítica y Reportes</h1>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Sincronización Sheets Activa
                        </div>
                        <div className="text-[10px] text-slate-500">Auto-push a la nube</div>
                    </div>
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => {
                            const API_URL = import.meta.env.VITE_API_URL || '/api';
                            const token = session?.access_token;
                            if (token) {
                                handleDownloadExcel();
                            }
                        }}
                    >
                        <Download size={18} /> Exportar Excel
                    </button>
                </div>
            </header>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>

                {/* CHART 1: PROVIDER TRENDS (Visible if data exists) */}
                <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '500' }}>
                        Gasto Mensual por Proveedor
                    </h2>
                    {stats.providerTrends.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={stats.providerTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                                        formatter={(val) => formatCurrency(val)}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    {providerKeys.map((key, index) => (
                                        <Line
                                            key={key}
                                            type="monotone"
                                            dataKey={key}
                                            stroke={LINE_COLORS[index % LINE_COLORS.length]}
                                            strokeWidth={3}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>Registra compras en diferentes meses para ver tendencias.</p>
                        </div>
                    )}
                </div>

                {/* CHART 2: CATEGORY DIST */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '500' }}>
                        Distribución por Categoría
                    </h2>

                    {stats.byCategory.length > 0 ? (
                        <>
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <p>Mayor gasto en: <strong style={{ color: 'var(--color-primary)' }}>{getMaxCategory(stats.byCategory)}</strong></p>
                            </div>

                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={stats.byCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.byCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                                        />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>No hay datos suficientes.</p>
                        </div>
                    )}
                </div>

                {/* CHART 3: PROVIDER DIST */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '500' }}>
                        Gasto por Proveedor (Top 5)
                    </h2>

                    {stats.byProvider.length > 0 ? (
                        <>
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                <p>Mayor proveedor: <strong style={{ color: 'var(--color-primary)' }}>{stats.byProvider[0].name}</strong></p>
                            </div>

                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={stats.byProvider}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.byProvider.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                                        />
                                        <Legend iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>No hay datos de proveedores.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Insights;
