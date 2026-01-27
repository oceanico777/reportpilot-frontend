import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Store, Calendar, FileText } from 'lucide-react';
import { saveReportOffline } from '../utils/offlineManager';

const NewPurchase = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form Fields
    const [providerId, setProviderId] = useState(''); // Selected Provider
    const [manualVendor, setManualVendor] = useState(''); // If provider not in list
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [sourceFilePath, setSourceFilePath] = useState('');

    // Data Management
    const [providers, setProviders] = useState([]);
    const [extractedData, setExtractedData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const { session } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

    // Categories
    const CATEGORIES = [
        { id: 'Carnes', label: 'Carnes', icon: '🥩', color: 'from-red-500 to-rose-700' },
        { id: 'Verduras', label: 'Verduras', icon: '🥦', color: 'from-green-400 to-emerald-600' },
        { id: 'Bebidas', label: 'Bebidas', icon: '🥤', color: 'from-blue-400 to-cyan-600' },
        { id: 'Aseo', label: 'Aseo', icon: '🧼', color: 'from-purple-400 to-indigo-500' },
        { id: 'Mantenimiento', label: 'Mantenimiento', icon: '🔧', color: 'from-gray-400 to-slate-600' },
        { id: 'Desechables', label: 'Desechables', icon: '🥡', color: 'from-yellow-400 to-orange-500' },
        { id: 'Otros', label: 'Otros', icon: '📦', color: 'from-gray-400 to-gray-600' }
    ];

    // Listen for connectivity
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Fetch Providers
    useEffect(() => {
        if (session?.access_token) {
            fetchProviders();
        }
    }, [session]);

    const fetchProviders = async () => {
        try {
            const res = await fetch(`${API_URL}/providers`, {
                headers: { "Authorization": `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProviders(data);
            }
        } catch (err) {
            console.error("Failed to fetch providers", err);
            // Fallback mock
            setProviders([
                { id: '1', name: 'Coca Cola', category: 'Bebidas' },
                { id: '2', name: 'MacPollo', category: 'Carnes' }
            ]);
        }
    };

    const handleUploadSuccess = (filePath, ocrData) => {
        setSourceFilePath(filePath);
        if (ocrData && !ocrData.error) {
            setExtractedData(ocrData);

            // Auto-fill logic
            if (ocrData.date) setPurchaseDate(ocrData.date);
            if (ocrData.vendor) setManualVendor(ocrData.vendor);

            // Try to match provider by name
            const match = providers.find(p => p.name.toLowerCase().includes(ocrData.vendor?.toLowerCase()));
            if (match) setProviderId(match.id);

            // Category suggestion
            if (ocrData.category) {
                const catMatch = CATEGORIES.find(c => c.id === ocrData.category || c.label === ocrData.category);
                if (catMatch) setSelectedCategory(catMatch.id);
            }

            // Items
            if (ocrData.items) {
                try {
                    const parsedItems = typeof ocrData.items === 'string' ? JSON.parse(ocrData.items) : ocrData.items;
                    setItems(parsedItems || []);
                } catch (e) {
                    console.error("Error parsing items", e);
                }
            }
        }
    };

    // Items State
    const [items, setItems] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);

    // Helper Component to fetch products when provider changes
    const InventoryFetcher = ({ providerId, onProductsLoaded }) => {
        const { session } = useAuth();
        useEffect(() => {
            if (providerId && session?.access_token) {
                const fetchProducts = async () => {
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
                        const res = await fetch(`${API_URL}/products/?provider_id=${providerId}`, {
                            headers: { "Authorization": `Bearer ${session.access_token}` }
                        });
                        if (res.ok) {
                            onProductsLoaded(await res.json());
                        }
                    } catch (e) { console.error(e); }
                };
                fetchProducts();
            } else {
                onProductsLoaded([]);
            }
        }, [providerId, session]);
        return null;
    };

    const handleItemChange = (idx, field, val) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: val };
        // Recalculate total if qty/price changes
        if (field === 'qty' || field === 'price') {
            const qty = parseFloat(newItems[idx].qty || 0);
            const price = parseFloat(newItems[idx].price || 0);
            newItems[idx].total = qty * price;
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: '', qty: 1, price: 0, total: 0 }]);
    };

    const removeItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!sourceFilePath) {
            setError('⚠️ Por favor, sube la foto de la factura.');
            return;
        }

        setLoading(true);

        const payload = {
            date: purchaseDate,
            amount: extractedData?.amount || 0,
            currency: extractedData?.currency || 'COP',
            category: selectedCategory || 'Otros',
            provider_id: providerId || null,
            source_file_path: sourceFilePath,
            extracted_data: {
                ...extractedData,
                vendor: manualVendor,
                items: items // Send the editable items list
            }
        };

        try {
            if (!isOnline) {
                saveReportOffline(payload); // We might need to adapt offline manager for purchases
                setSuccess('📡 Guardado en local (Offline).');
                resetForm();
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/purchases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(`Error ${res.status}: Fallo al registrar compra`);
            }

            const data = await res.json();
            setSuccess(`✅ Compra registrada con éxito. ID: ${data.id}`);

            setTimeout(() => {
                resetForm();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSuccess('');
        setError('');
        setSourceFilePath('');
        setExtractedData(null);
        setSelectedCategory(null);
        setProviderId('');
        setManualVendor('');
        setPurchaseDate(new Date().toISOString().split('T')[0]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-content"
        >
            <header className="page-header">
                <h1>Registrar Compra / Gasto</h1>
            </header>

            <motion.div
                className="glass-card"
                style={{ maxWidth: '800px', padding: '2rem' }}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
            >
                {/* Offline Alert */}
                {!isOnline && (
                    <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4 flex items-center gap-2">
                        <WifiOff size={18} />
                        <span>Modo Offline activo</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* 1. File Upload */}
                    <div>
                        <label className="input-label mb-2 block">1. Foto de la Factura</label>
                        <FileUpload key={sourceFilePath || 'empty'} onUploadSuccess={handleUploadSuccess} />
                    </div>

                    {/* 2. Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Provider Selection */}
                        <div>
                            <label className="input-label mb-2 block flex items-center gap-2">
                                <Store size={16} /> Proveedor
                            </label>
                            <select
                                className="input-field w-full"
                                value={providerId}
                                onChange={(e) => {
                                    setProviderId(e.target.value);
                                    // Reset manual vendor if provider selected
                                    if (e.target.value) setManualVendor('');
                                }}
                            >
                                <option value="">-- Seleccionar o Dejar Vacio --</option>
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {!providerId && (
                                <input
                                    type="text"
                                    className="input-field w-full mt-2"
                                    placeholder="O escriba el nombre del comercio..."
                                    value={manualVendor}
                                    onChange={e => setManualVendor(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Inventory Fetch Trigger */}
                        <InventoryFetcher providerId={providerId} onProductsLoaded={setAvailableProducts} />

                        {/* Date Selection */}
                        <div>
                            <label className="input-label mb-2 block flex items-center gap-2">
                                <Calendar size={16} /> Fecha Compra
                            </label>
                            <input
                                type="date"
                                className="input-field w-full"
                                value={purchaseDate}
                                onChange={e => setPurchaseDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 3. Category Selection */}
                    <AnimatePresence>
                        {(sourceFilePath || selectedCategory) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label className="input-label mb-2 block mt-4">3. Categoría</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2
                                                ${selectedCategory === cat.id
                                                    ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-slate-300'}
                                            `}
                                        >
                                            <span className="text-2xl">{cat.icon}</span>
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 4. OCR Results Preview */}
                    <AnimatePresence>
                        {extractedData && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 mt-4"
                            >
                                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                    ✨ Items Detectados
                                </h3>

                                <div className="space-y-2">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-black/20 p-2 rounded flex-wrap md:flex-nowrap">
                                            {/* Product Select or Input */}
                                            <div className="flex-grow min-w-[150px] relative">
                                                <input
                                                    className="bg-transparent border-b border-white/10 text-white w-full text-sm"
                                                    value={item.name}
                                                    list={`products-${idx}`}
                                                    placeholder="Producto"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        handleItemChange(idx, 'name', val);
                                                        // Auto-fill price if matched
                                                        const match = availableProducts.find(p => p.name === val);
                                                        if (match) {
                                                            handleItemChange(idx, 'price', match.last_price);
                                                            handleItemChange(idx, 'unit', match.unit);
                                                        }
                                                    }}
                                                />
                                                <datalist id={`products-${idx}`}>
                                                    {availableProducts.map(p => (
                                                        <option key={p.id} value={p.name}>{p.name} (${p.last_price})</option>
                                                    ))}
                                                </datalist>
                                            </div>
                                            <input
                                                className="bg-transparent border-b border-white/10 text-white w-16 text-right text-sm"
                                                type="number"
                                                value={item.qty}
                                                placeholder="Cant"
                                                onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value))}
                                            />
                                            <input
                                                className="bg-transparent border-b border-white/10 text-white w-20 text-right text-sm"
                                                type="number"
                                                value={item.price}
                                                placeholder="Precio"
                                                onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-2"
                                    >
                                        + Agregar Item
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feedback Messages */}
                    {error && <div className="text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-500/50">{error}</div>}
                    {success && <div className="text-emerald-400 bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/50">{success}</div>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 text-lg font-bold shadow-xl shadow-primary/20"
                    >
                        {loading ? 'Guardando...' : 'Registrar Compra'}
                    </button>

                </form>
            </motion.div>
        </motion.div>
    );
};

export default NewPurchase;
