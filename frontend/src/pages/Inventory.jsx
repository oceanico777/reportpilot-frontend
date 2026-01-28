import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Plus, Search, Tag, DollarSign, Filter, Store } from 'lucide-react';

const Inventory = () => {
    const { session } = useAuth();
    const [products, setProducts] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filter State
    const [selectedProvider, setSelectedProvider] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [newProduct, setNewProduct] = useState({ name: '', unit: 'unit', provider_id: '', last_price: 0 });

    useEffect(() => {
        if (session?.access_token) {
            fetchInitialData();
        }
    }, [session]);

    const fetchInitialData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

            // Parallel fetch
            const [prodRes, provRes] = await Promise.all([
                fetch(`${API_URL}/products/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
                fetch(`${API_URL}/providers/`, { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
            ]);

            if (prodRes.ok) setProducts(await prodRes.json());
            if (provRes.ok) setProviders(await provRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
            const res = await fetch(`${API_URL}/products/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newProduct)
            });

            if (res.ok) {
                const created = await res.json();
                setProducts([...products, created]);
                setShowModal(false);
                setNewProduct({ name: '', unit: 'unit', provider_id: '', last_price: 0 });
            } else {
                alert("Error al crear producto");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesProvider = selectedProvider ? p.provider_id === selectedProvider : true;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProvider && matchesSearch;
    });

    const getProviderName = (id) => providers.find(p => p.id === id)?.name || 'Desconocido';

    return (
        <div className="page-content">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Inventario de Insumos</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Gestiona los productos básicos y sus costos</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} style={{ marginRight: '8px' }} />
                    Nuevo Insumo
                </button>
            </header>

            {/* Filters */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--color-bg)', padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar insumo..."
                        style={{ border: 'none', background: 'transparent', padding: '0.8rem', width: '100%', outline: 'none', color: 'var(--color-text)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ minWidth: '200px', display: 'flex', alignItems: 'center', background: 'var(--color-bg)', padding: '0 1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <Filter size={18} style={{ color: 'var(--color-text-muted)', marginRight: '8px' }} />
                    <select
                        style={{ border: 'none', background: 'transparent', padding: '0.8rem', width: '100%', outline: 'none', color: 'var(--color-text)' }}
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                        <option value="">Todos los Proveedores</option>
                        {providers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {filteredProducts.map(product => (
                    <div key={product.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                <Package size={24} color="#10b981" />
                            </div>
                            <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                                {product.unit}
                            </span>
                        </div>

                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{product.name}</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <Store size={14} />
                            <span>{getProviderName(product.provider_id)}</span>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Último Costo</span>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.last_price)}
                            </span>
                        </div>
                    </div>
                ))}

                {filteredProducts.length === 0 && (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No se encontraron insumos.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Nuevo Insumo</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Nombre del Producto</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    placeholder="Ej. Papa Capira"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Proveedor Principal</label>
                                <select
                                    className="form-input"
                                    required
                                    value={newProduct.provider_id}
                                    onChange={(e) => setNewProduct({ ...newProduct, provider_id: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Unidad de Medida</label>
                                <select
                                    className="form-input"
                                    value={newProduct.unit}
                                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                >
                                    <option value="unit">Unidad</option>
                                    <option value="kg">Kilogramo (kg)</option>
                                    <option value="lb">Libra (lb)</option>
                                    <option value="lt">Litro (lt)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Precio de Referencia</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={newProduct.last_price}
                                    onChange={(e) => setNewProduct({ ...newProduct, last_price: e.target.value })}
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
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
