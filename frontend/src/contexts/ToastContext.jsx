import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const Toast = ({ message, type, onClose }) => {
    let icon, color;
    switch (type) {
        case 'success': icon = <CheckCircle size={20} />; color = 'var(--color-success)'; break;
        case 'error': icon = <XCircle size={20} />; color = 'var(--color-danger)'; break;
        default: icon = <Info size={20} />; color = 'var(--color-primary)';
    }

    const toastStyle = {
        position: 'fixed', bottom: '20px', right: '20px', padding: '1rem 1.5rem',
        backgroundColor: 'var(--color-surface)', borderLeft: `5px solid ${color}`,
        borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        color: 'var(--color-text)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '0.75rem',
        animation: 'slideIn 0.3s ease-out',
    };

    return (
        <div style={toastStyle}>
            {icon}
            <span>{message}</span>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info', duration = 4000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    };

    const value = { showToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </ToastContext.Provider>
    );
};
