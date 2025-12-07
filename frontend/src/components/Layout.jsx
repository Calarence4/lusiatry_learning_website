import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarCheck, Globe, Home, HelpCircle, GraduationCap } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-slate-800 text-white font-medium shadow-md'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
        >
            <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-sm tracking-wide">{label}</span>
        </Link>
    );
};

const Navbar = () => (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center">
        <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-slate-200">L</div>
                <span className="text-lg font-bold tracking-tight text-slate-800">Lusiatry</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
                <NavItem to="/" icon={Home} label="首页" />
                <NavItem to="/news" icon={Globe} label="每日资讯" />
                <NavItem to="/checkin" icon={CalendarCheck} label="打卡计划" />
                <NavItem to="/course" icon={GraduationCap} label="课程追踪" />
                <NavItem to="/questions" icon={HelpCircle} label="问题集" />
                <NavItem to="/knowledge" icon={BookOpen} label="知识库" />
                <NavItem to="/dashboard" icon={LayoutDashboard} label="数据" />
            </div>
        </div>
    </nav>
);

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}