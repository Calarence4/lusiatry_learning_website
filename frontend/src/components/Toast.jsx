import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast 类型配置
const TOAST_CONFIG = {
    success: {
        icon: CheckCircle,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        iconClass: 'text-emerald-500'
    },
    error: {
        icon: XCircle,
        className: 'bg-red-50 border-red-200 text-red-700',
        iconClass: 'text-red-500'
    },
    warning: {
        icon: AlertTriangle,
        className: 'bg-amber-50 border-amber-200 text-amber-700',
        iconClass: 'text-amber-500'
    },
    info: {
        icon: Info,
        className: 'bg-blue-50 border-blue-200 text-blue-700',
        iconClass: 'text-blue-500'
    }
};

// 单个 Toast 组件
const ToastItem = ({ toast, onRemove }) => {
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const Icon = config.icon;

    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, toast.duration || 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md min-w-[280px] max-w-[400px] ${config.className}`}
        >
            <Icon size={20} className={`shrink-0 ${config.iconClass}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
                <X size={14} className="opacity-50" />
            </button>
        </motion.div>
    );
};

// Toast 容器
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback({
        success: (msg, duration) => addToast(msg, 'success', duration),
        error: (msg, duration) => addToast(msg, 'error', duration),
        warning: (msg, duration) => addToast(msg, 'warning', duration),
        info: (msg, duration) => addToast(msg, 'info', duration),
    }, [addToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// 表单验证辅助：摇晃动画 CSS 类
export const shakeAnimation = 'animate-shake';

// 需要在 index.css 中添加:
// @keyframes shake {
//   0%, 100% { transform: translateX(0); }
//   25% { transform: translateX(-4px); }
//   75% { transform: translateX(4px); }
// }
// .animate-shake { animation: shake 0.3s ease-in-out; }

export default ToastProvider;
