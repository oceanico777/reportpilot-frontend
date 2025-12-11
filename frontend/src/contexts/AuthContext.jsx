import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState({
        user: { email: 'guide@reportpilot.com' },
        access_token: 'fake-jwt-token-for-auth'
    });

    const signOut = () => setSession(null);
    const signIn = () => setSession({ user: { email: 'guide@reportpilot.com' }, access_token: 'fake-jwt-token-for-auth' });

    const value = { user: session?.user, session, signOut, signIn };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
