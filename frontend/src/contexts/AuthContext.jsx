import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState({
        user: { email: 'guide@reportpilot.com', role: 'guide' },
        access_token: 'fake-jwt-token-for-auth'
    });

    const signOut = () => setSession(null);
    const signIn = (role = 'guide') => setSession({
        user: { email: `${role}@reportpilot.com`, role: role },
        access_token: 'fake-jwt-token-for-auth'
    });

    const switchRole = () => {
        setSession(prev => ({
            ...prev,
            user: {
                ...prev.user,
                role: prev.user.role === 'guide' ? 'accountant' : 'guide'
            }
        }));
    };

    const value = { user: session?.user, session, signOut, signIn, switchRole };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
