import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('geocrop_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const signup = (name, email, password) => {
        const users = JSON.parse(localStorage.getItem('geocrop_users') || '[]');

        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already registered' };
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password: btoa(password), // Simple encoding (not secure, just for demo)
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('geocrop_users', JSON.stringify(users));

        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem('geocrop_user', JSON.stringify(userWithoutPassword));

        return { success: true };
    };

    const login = (email, password) => {
        const users = JSON.parse(localStorage.getItem('geocrop_users') || '[]');
        const foundUser = users.find(u => u.email === email && u.password === btoa(password));

        if (!foundUser) {
            return { success: false, error: 'Invalid email or password' };
        }

        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('geocrop_user', JSON.stringify(userWithoutPassword));

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('geocrop_user');
    };

    const updateProfile = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('geocrop_user', JSON.stringify(updatedUser));

        const users = JSON.parse(localStorage.getItem('geocrop_users') || '[]');
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updates };
            localStorage.setItem('geocrop_users', JSON.stringify(users));
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signup, login, logout, updateProfile, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
