import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    TrendingUp, 
    Award, 
    Megaphone, 
    CreditCard,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Trophy,
    Dribbble,
    Briefcase,
    ClipboardCheck
} from 'lucide-react';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navLinks = {
        ADMIN: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/athletes', label: 'Athletes', icon: Users },
            { to: '/batches', label: 'Batches', icon: Award },
            { to: '/schedules', label: 'Schedules', icon: Calendar },
            { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
            { to: '/performance', label: 'Performance', icon: TrendingUp },
            { to: '/admin/fees', label: 'Finances', icon: CreditCard },
            { to: '/announcements', label: 'Announcements', icon: Megaphone },
            { to: '/coaches', label: 'Coaches', icon: Briefcase },
            { to: '/sports', label: 'Sports', icon: Dribbble },
        ],
        COACH: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/my-batches', label: 'My Batches', icon: Award },
            { to: '/attendance', label: 'Attendance', icon: Users },
            { to: '/performance', label: 'Performance', icon: TrendingUp },
            { to: '/announcements', label: 'Announcements', icon: Megaphone },
        ],
        ATHLETE: [
            { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
            { to: '/my-performance', label: 'My Growth', icon: Trophy },
            { to: '/my-attendance', label: 'Attendance', icon: Calendar },
            { to: '/fees', label: 'Fees & Payments', icon: CreditCard },
            { to: '/announcements', label: 'Notice Board', icon: Megaphone },
        ],
    };

    const links = navLinks[user?.role] || [];

    const isActive = (path) => location.pathname === path;

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-50 w-72 glass-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div className="flex flex-col h-full">
                {/* Logo Section */}
                <div className="p-8 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center">
                            <Trophy className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight">ELITE<span className="text-primary-600">SPORTS</span></span>
                    </Link>
                    <button onClick={toggleSidebar} className="lg:hidden text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4 custom-scrollbar">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = isActive(link.to);
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 group ${
                                    active 
                                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/25 ring-4 ring-primary-500/10' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary-600'
                                }`}
                            >
                                <Icon size={20} className={`${active ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                                <span className="text-sm">{link.label}</span>
                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section (User Info & Style) */}
                <div className="p-6 border-t border-slate-100/50 bg-slate-50/30 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                             <img 
                                src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=6366f1&color=fff`} 
                                alt={`${user?.first_name}'s Avatar`} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                    <div className="mt-4 text-[10px] text-center text-slate-300 font-bold tracking-widest uppercase">
                        v2.0 Beta • Design by AI
                    </div>
                </div>
            </div>
        </aside>
    );
};
