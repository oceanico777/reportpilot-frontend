import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const Dashboard = () => {
    // --- 1. ESTADO Y LÓGICA DE APROBACIONES ---
    const [reports, setReports] = useState([
        { id: 1, name: 'Tour ID: T-001 - Juan P.', date: 'Oct 24, 2025', status: 'Approved', amount: '$450' },
        { id: 2, name: 'Tour ID: T-002 - Ana M.', date: 'Oct 23, 2025', status: 'Pending', amount: '$120' },
        { id: 3, name: 'Tour ID: T-003 - Grupo X', date: 'Oct 22, 2025', status: 'Pending', amount: '$890' },
    ]);

    const handleApprove = (id) => {
        setReports(reports.map(report =>
            report.id === id
                ? { ...report, status: 'Approved' }
                : report
        ));
    };

    // --- 2. SIMULACIÓN DE PRESUPUESTO ---
    const TOTAL_BUDGET = 5000000; // $5,000,000 COP
    const CONSUMED_AMOUNT = 3950000; // $3,950,000 COP (Simulación, 79% consumido)

    const consumedPercentage = (CONSUMED_AMOUNT / TOTAL_BUDGET) * 100;

    let budgetColor = '#10B981'; // Verde (Por defecto)
    let budgetStatus = 'ÓPTIMO';

    if (consumedPercentage >= 90) {
        budgetColor = '#EF4444'; // Rojo (CRÍTICO)
        budgetStatus = '¡CRÍTICO!';
    } else if (consumedPercentage >= 75) {
        budgetColor = '#FBBF24'; // Amarillo (ALERTA)
        budgetStatus = 'ALERTA';
    }

    const formatCurrency = (amount) => {
        // Formato para pesos colombianos (COP)
        return amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    };

    // --- 3. DATOS PARA GRÁFICOS ---
    const categoryData = [
        { name: 'Restaurantes', value: 4500, color: '#0088FE' },
        { name: 'Entradas', value: 3200, color: '#00C49F' },
        { name: 'Guía / Servicios', value: 2000, color: '#FFBB28' },
        { name: 'Transporte', value: 1500, color: '#FF8042' },
    ];

    const monthlyStats = [
        { month: 'Jun', total: 45 },
        { month: 'Jul', total: 52 },
        { month: 'Aug', total: 68 },
        { month: 'Sep', total: 85 },
        { month: 'Oct', total: 98 },
        { month: 'Nov', total: 124 },
    ];

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '0.8rem' }}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="page-content">
            <header className="page-header">
                <div>
                    <h1>Dashboard Financiero</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Resumen de la actividad de los últimos tours</p>
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
                    <h3>Total Reports</h3>
                    <p className="stat-value">124</p>
                    <span className="stat-change positive">+12% this month</span>
                </div>
                <div className="card stat-card">
                    <h3>Generated Today</h3>
                    <p className="stat-value">8</p>
                </div>
                <div className="card stat-card">
                    <h3>Credits Remaining</h3>
                    <p className="stat-value">450</p>
                </div>
            </div>

            {/* SECCIÓN DE SIMULACIÓN DE PRESUPUESTO */}
            <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text)' }}>Presupuesto: Tour ID T-001</h2>

                {/* Indicadores de Consumo */}
                <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                        Gasto Consumido: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(CONSUMED_AMOUNT)}</strong>
                    </span>
                    <span style={{ fontWeight: 'bold', color: budgetColor }}>
                        {consumedPercentage.toFixed(1)}%
                    </span>
                </div>

                {/* Barra de Progreso (Barra de Alerta) */}
                <div style={{
                    height: '10px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${Math.min(consumedPercentage, 100)}%`,
                        transition: 'width 0.5s ease-in-out',
                        backgroundColor: budgetColor
                    }} />
                </div>

                {/* Pie de Presupuesto */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <span>
                        Presupuesto Total: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(TOTAL_BUDGET)}</strong>
                    </span>
                    <span style={{ fontWeight: 'bold', color: budgetColor }}>
                        Estatus: {budgetStatus}
                    </span>
                </div>
            </div>

            {/* GRÁFICOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>

                {/* Distribución de Gastos por Tour (Gráfico Pie) */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Distribución de Gastos</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                innerRadius={50}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' }} />
                            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico Lineal */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Reportes Generados Mensualmente</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.875rem' }} />
                            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '0.875rem' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text)' }} />
                            <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* TABLA DE APROBACIONES */}
            <div className="recent-activity" style={{ marginTop: '2rem' }}>
                <h2>Aprobación de Gastos</h2>
                <div className="card table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Reporte / Cliente</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td>{report.name}</td>
                                    <td>{report.date}</td>
                                    <td>{report.amount}</td>
                                    <td>
                                        <span className={`badge ${report.status === 'Approved' ? 'success' : 'processing'}`}>
                                            {report.status === 'Approved' ? 'Aprobado' : 'Pendiente IA'}
                                        </span>
                                    </td>
                                    <td>
                                        {report.status === 'Pending' ? (
                                            <button
                                                onClick={() => handleApprove(report.id)}
                                                className="btn-sm"
                                                style={{
                                                    backgroundColor: 'var(--color-primary)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                            >
                                                <CheckCircle size={14} /> Aprobar
                                            </button>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Listo</span>
                                        )}
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
