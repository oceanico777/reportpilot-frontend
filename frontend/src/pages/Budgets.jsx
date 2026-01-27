import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Calendar, Info, Loader, Plus, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const Budgets = () => {
    const { session } = useAuth();
    const [budgetData, setBudgetData] = useState(null); // { period, month, year, comparison: [] }
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Modal State
    const [editingCategory, setEditingCategory] = useState({ category: '', amount: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (session?.access_token) {
            fetchBudgets();
        }
    }, [session]);

    const fetchBudgets = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/budgets/status?period=MONTHLY`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBudgetData(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const payload = {
                period: "MONTHLY",
                category: editingCategory.category,
                budget_amount: parseFloat(editingCategory.amount)
            };

            const res = await fetch(`${API_URL}/budgets/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                setEditingCategory({ category: '', amount: '' });
                fetchBudgets(); // Refresh data
            } else {
                alert("Error al guardar presupuesto");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (category = '', currentAmount = '') => {
        setEditingCategory({ category, amount: currentAmount });
        setShowModal(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                <Loader className="animate-spin" size={32} color="var(--color-primary)" />
            </div>
        );
    }

    // Sort comparison: Over budget first, then by utilization %
    const sortedComparison = budgetData?.comparison?.sort((a, b) => b.percent - a.percent) || [];
    const totalBudget = sortedComparison.reduce((acc, item) => acc + (item.budget || 0), 0);
    const totalSpent = sortedComparison.reduce((acc, item) => acc + (item.actual || 0), 0);
    const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return (
        <div className="page-content">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Control de Presupuestos</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Mensual • {new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => openEditModal()}>
                    <Plus size={20} style={{ marginRight: '8px' }} />
                    Definir Presupuesto
                </button>
            </header>

            <div className="dashboard-grid">
                {/* Overall Status Card */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>Ejecución Global</h3>
                        <span style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold',
                            background: totalPercent > 100 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: totalPercent > 100 ? '#ef4444' : '#10b981'
                        }}>
                            {totalPercent.toFixed(1)}% Ejecutado
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Presupuesto Total</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{formatCurrency(totalBudget)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Gasto Real</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: totalPercent > 100 ? '#ef4444' : 'var(--color-primary)' }}>{formatCurrency(totalSpent)}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Disponible</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: (totalBudget - totalSpent) < 0 ? '#ef4444' : '#10b981' }}>
                                {formatCurrency(totalBudget - totalSpent)}
                            </div>
                        </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div style={{ marginTop: '1.5rem', height: '12px', background: 'var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(totalPercent, 100)}%`,
                            background: totalPercent > 100 ? '#ef4444' : '#10b981',
                            transition: 'width 1s ease'
                        }}></div>
                    </div>
                </div>

                {/* Categories List */}
                <div className="card" style={{ gridColumn: 'span 1', gridRow: 'span 2' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Detalle por Categoría</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                        {sortedComparison.map((item, idx) => (
                            <div key={idx} style={{
                                padding: '1rem', borderRadius: '8px',
                                background: 'var(--color-bg-alt)',
                                borderLeft: `4px solid ${item.percent > 100 ? '#ef4444' : item.percent > 80 ? '#f59e0b' : '#10b981'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '500' }}>{item.category}</span>
                                    {item.budget > 0 && (
                                        <button
                                            onClick={() => openEditModal(item.category, item.budget)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                            title="Editar Presupuesto"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Real: {formatCurrency(item.actual)}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Meta: {formatCurrency(item.budget)}</span>
                                </div>

                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
                                    <div style={{
                                        height: '100%',
                                        borderRadius: '3px',
                                        width: `${Math.min(item.percent, 100)}%`,
                                        background: item.percent > 100 ? '#ef4444' : item.percent > 90 ? '#f59e0b' : '#3b82f6'
                                    }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '4px', color: item.percent > 100 ? '#ef4444' : 'var(--color-text-muted)' }}>
                                    {item.percent.toFixed(0)}%
                                </div>
                            </div>
                        ))}

                        {sortedComparison.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                                Aún no has registrado gastos ni presupuestos.
                            </div>
                        )}
                    </div>
                </div>

                {/* Tips/Alerts Card */}
                <div className="glass-card" style={{ gridColumn: 'span 1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#f59e0b' }}>
                        <AlertTriangle size={20} />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Alertas</h3>
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        {sortedComparison.filter(i => i.percent > 100).map((i, idx) => (
                            <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                <strong>{i.category}</strong> ha excedido el presupuesto por {formatCurrency(i.actual - i.budget)}.
                            </li>
                        ))}
                        {sortedComparison.filter(i => i.percent > 100).length === 0 && (
                            <li>¡Excelente! Todos los gastos están dentro del presupuesto.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Modal for Creating/Editing Budget */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Definir Presupuesto</h2>
                        <form onSubmit={handleSaveBudget}>
                            <div className="form-group">
                                <label>Categoría</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    list="category-suggestions"
                                    value={editingCategory.category}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, category: e.target.value })}
                                    placeholder="Ej. Alimentación"
                                />
                                <datalist id="category-suggestions">
                                    <option value="Alimentación" />
                                    <option value="Bebidas" />
                                    <option value="Mantenimiento" />
                                    <option value="Nómina" />
                                    <option value="Arriendo" />
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Monto Mensual Límite</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    required
                                    min="0"
                                    value={editingCategory.amount}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, amount: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;
