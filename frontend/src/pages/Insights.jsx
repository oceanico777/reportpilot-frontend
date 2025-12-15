import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Insights = () => {
    const { session } = useAuth();
    const [stats, setStats] = useState({
        byCategory: []
    });

    useEffect(() => {
        if (session?.access_token) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/reports/?limit=100`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();
            processData(data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const processData = (data) => {
        const categoryMap = {};

        data.forEach(report => {
            // Use structured data if available, fallback to 0/Uncategorized
            const amount = report.amount || 0;
            const category = report.category || 'Sin Categoría';

            if (amount > 0) {
                // Aggregate Category
                categoryMap[category] = (categoryMap[category] || 0) + amount;
            }
        });

        // Format for Recharts
        const byCategory = Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key]
        }));

        setStats({ byCategory });
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

    return (
        <div className="page-content">
            <header className="page-header">
                <div>
                    <h1>Patrones</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Cómo se distribuye el gasto histórico</p>
                </div>
            </header>

            {/* CHART SECTION */}
            <div className="card" style={{ padding: '2rem', marginTop: '1rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.1rem', fontWeight: '500' }}>
                    Distribución por Categoría
                </h2>

                {stats.byCategory.length > 0 ? (
                    <>
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <p>Mayor actividad: <strong style={{ color: 'var(--color-primary)' }}>{getMaxCategory(stats.byCategory)}</strong></p>
                        </div>

                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={stats.byCategory}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={80}
                                        outerRadius={110}
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
                                    <Legend verticalAlign="bottom" height={80} iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '1rem' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p>No hay datos suficientes para mostrar patrones aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
