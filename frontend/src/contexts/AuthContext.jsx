import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenManager } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 检查是否已登录
    const checkAuth = useCallback(async () => {
        const token = tokenManager.getToken();
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
        } catch (err) {
            tokenManager.clearTokens();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始化时检查登录状态
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // 登录
    const login = async (username, password) => {
        setError(null);
        try {
            const data = await authApi.login({ username, password });
            tokenManager.setTokens(data.accessToken);
            setUser(data.user);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.error || err.message || '登录失败';
            setError(message);
            return { success: false, error: message };
        }
    };

    // 登出
    const logout = async () => {
        tokenManager.clearTokens();
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        checkAuth,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;