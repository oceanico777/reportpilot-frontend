import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();
        signIn();
        navigate('/dashboard');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <div className="card" style={{ padding: '2rem', width: '300px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-text)' }}>ReportPilot AI</h2>
                <button onClick={handleLogin} className="btn-primary" style={{ width: '100%' }}>
                    Simular Login
                </button>
            </div>
        </div>
    );
};
