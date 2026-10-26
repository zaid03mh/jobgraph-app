/**
 * JobGraph - Authentication Context
 * Global auth state management
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for stored auth on mount
    useEffect(() => {
        checkStoredAuth();
    }, []);

    const checkStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Verify token is still valid
                try {
                    const response = await authAPI.getProfile();
                    setUser(response.data.user);
                } catch (err) {
                    // Token invalid, clear storage
                    await logout();
                }
            }
        } catch (err) {
            console.log('Auth check error:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.login({ email, password });

            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            setToken(response.data.token);
            setUser(response.data.user);

            return response.data.user;
        } catch (err) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authAPI.register(userData);

            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            setToken(response.data.token);
            setUser(response.data.user);

            return response.data.user;
        } catch (err) {
            setError(err.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        console.log('Logout called - clearing auth state');
        // Clear state FIRST to trigger navigation immediately
        setToken(null);
        setUser(null);
        // Then clean up storage
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            console.log('Logout complete - storage cleared');
        } catch (err) {
            console.log('Logout storage error:', err);
        }
    };

    const updateUser = async (userData) => {
        try {
            const response = await authAPI.updateProfile(userData);
            const updatedUser = { ...user, ...response.data.user };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (err) {
            throw err;
        }
    };

    const refreshUser = async () => {
        try {
            const response = await authAPI.getProfile();
            const updatedUser = response.data.user;
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (err) {
            throw err;
        }
    };

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        setError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
