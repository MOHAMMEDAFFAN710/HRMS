import React, { createContext, useState, useEffect } from 'react';
import API from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
    const loadUser = async () => {
    try {
        const { data } = await API.getCurrentUser();
        setUser(data);
    } catch (err) {
        localStorage.removeItem('token');
    } finally {
        setLoading(false);
    }
    };
    
    if (localStorage.getItem('token')) {
    loadUser();
    } else {
    setLoading(false);
    }
}, []);

const login = async (credentials) => {
    const { data } = await API.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
};

const logout = async () => {
    await API.logout();
    localStorage.removeItem('token');
    setUser(null);
};

return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
    {children}
    </AuthContext.Provider>
);
};