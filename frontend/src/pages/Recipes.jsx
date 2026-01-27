import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, Plus, Trash2, Save, X, ChevronRight, DollarSign } from 'lucide-react';

const Recipes = () => {
    const { session } = useAuth();
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null); // For Detail View
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Forms
    const [newRecipeName, setNewRecipeName] = useState('');
    const [newRecipePrice, setNewRecipePrice] = useState(0);

    // Add Item Form
    const [newItemProductId, setNewItemProductId] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(0);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

    useEffect(() => {
        if (session?.access_token) {
            fetchInitialData();
        }
    }, [session]);

    const fetchInitialData = async () => {
        try {
            const [recRes, prodRes] = await Promise.all([
                fetch(`${API_URL}/recipes/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
                fetch(`${API_URL}/products/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            ]);

            if (recRes.ok) setRecipes(await recRes.json());
            if (prodRes.ok) setProducts(await prodRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRecipe = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/recipes/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ name: newRecipeName, sale_price: parseFloat(newRecipePrice) })
            });

            if (res.ok) {
                await fetchInitialData();
                setShowCreateModal(false);
                setNewRecipeName('');
                setNewRecipePrice(0);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!selectedRecipe || !newItemProductId) return;

        try {
            const res = await fetch(`${API_URL}/recipes/${selectedRecipe.id}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    product_id: newItemProductId,
                    quantity: parseFloat(newItemQuantity)
                })
            });

            if (res.ok) {
                // Refresh recipes to get updated calculation
                const recRes = await fetch(`${API_URL}/recipes/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
                const updatedRecipes = await recRes.json();
                setRecipes(updatedRecipes);

                // Update selected View
                const updatedSelected = updatedRecipes.find(r => r.id === selectedRecipe.id);
                setSelectedRecipe(updatedSelected);

                // Reset form
                setNewItemProductId('');
                setNewItemQuantity(0);
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await fetch(`${API_URL}/recipes/${selectedRecipe.id}/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            // Refresh
            const recRes = await fetch(`${API_URL}/recipes/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } });
            const updatedRecipes = await recRes.json();
            setRecipes(updatedRecipes);
            setSelectedRecipe(updatedRecipes.find(r => r.id === selectedRecipe.id));
        } catch (e) { console.error(e); }
    };

    // Helper formatting
    const money = val => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="page-content">
            <header className="page-header flex justify-between items-center">
                <div>
                    <h1>Recetas (Escandallos)</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Costo real vs Precio de Venta</p>
                </div>
                {!selectedRecipe && (
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={20} className="mr-2" /> Nueva Receta
                    </button>
                )}
            </header>

            {selectedRecipe ? (
                /* DETAIL VIEW */
                <div className="animate-fade-in">
                    <button
                        onClick={() => setSelectedRecipe(null)}
                        className="mb-4 text-blue-400 hover:text-blue-300 flex items-center gap-2"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                    >
                        &larr; Volver
                    </button>

                    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 300px' }}>
                        {/* LEFT: Ingredients List */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Ingredientes de "{selectedRecipe.name}"</h2>

                            {selectedRecipe.items.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay ingredientes aún.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                            <th style={{ padding: '8px' }}>Insumo</th>
                                            <th style={{ padding: '8px' }}>Cantidad</th>
                                            <th style={{ padding: '8px' }}>Costo Unit.</th>
                                            <th style={{ padding: '8px' }}>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRecipe.items.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '12px 8px' }}>{item.product_name}</td>
                                                <td style={{ padding: '12px 8px' }}>{item.quantity} {item.unit}</td>
                                                <td style={{ padding: '12px 8px' }}>{money(item.unit_price)}</td>
                                                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{money(item.total_cost)}</td>
                                                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Add Item Form */}
                            <form onSubmit={handleAddItem} style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Agregar Insumo</h3>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 2 }}>
                                        <select
                                            className="input-field w-full"
                                            required
                                            value={newItemProductId}
                                            onChange={e => setNewItemProductId(e.target.value)}
                                        >
                                            <option value="">-- Seleccionar Insumo --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="number" step="0.001"
                                            className="input-field w-full"
                                            placeholder="Cantidad"
                                            required
                                            value={newItemQuantity}
                                            onChange={e => setNewItemQuantity(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT: Financial Summary */}
                        <div>
                            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Costo Total (Materia Prima)</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{money(selectedRecipe.total_cost)}</div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Precio de Venta</h3>
                                <div style={{ fontSize: '1.5rem' }}>{money(selectedRecipe.sale_price)}</div>
                            </div>

                            <div className="card" style={{ padding: '1.5rem', background: selectedRecipe.margin > 30 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${selectedRecipe.margin > 30 ? '#10b981' : '#ef4444'}` }}>
                                <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Margen Bruto</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: selectedRecipe.margin > 30 ? '#10b981' : '#ef4444' }}>
                                    {selectedRecipe.margin.toFixed(1)}%
                                </div>
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
                                    Ganancia: {money(selectedRecipe.sale_price - selectedRecipe.total_cost)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* LIST VIEW */
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {recipes.map(recipe => (
                        <div
                            key={recipe.id}
                            className="card card-hover"
                            style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative' }}
                            onClick={() => setSelectedRecipe(recipe)}
                        >
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.5 }}>
                                <ChevronRight />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <div style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '8px', color: 'white' }}>
                                    <ChefHat size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{recipe.name}</h3>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Costo:</span>
                                <b>{money(recipe.total_cost)}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Venta:</span>
                                <b>{money(recipe.sale_price)}</b>
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', color: recipe.margin > 30 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                Margen: {recipe.margin.toFixed(1)}%
                            </div>
                        </div>
                    ))}

                    {recipes.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <p>Crea tu primera receta para empezar a controlar costos.</p>
                        </div>
                    )}
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '400px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Nueva Receta</h2>
                        <form onSubmit={handleCreateRecipe}>
                            <div className="form-group">
                                <label>Nombre del Plato</label>
                                <input className="input-field w-full" required value={newRecipeName} onChange={e => setNewRecipeName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Precio de Venta (Carta)</label>
                                <input type="number" className="input-field w-full" required value={newRecipePrice} onChange={e => setNewRecipePrice(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recipes;
