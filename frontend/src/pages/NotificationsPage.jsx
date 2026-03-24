import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { academyService } from '../services';
import { 
    Bell, Check, Trash2, Calendar, Info, AlertCircle, 
    CreditCard, Award, Megaphone, CheckCircle2, 
    ArrowRight, BellRing, Sparkles, Clock, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "", unread = false }) => (
    <div className={`relative bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${unread ? 'ring-1 ring-primary-500/20 bg-primary-50/10' : ''} ${className}`}>
        {children}
    </div>
);

const NotificationIcon = ({ type, unread }) => {
    const configs = {
        fee: { icon: <CreditCard size={20} />, bg: 'bg-emerald-100', color: 'text-emerald-600', shadow: 'shadow-emerald-200' },
        performance: { icon: <Award size={20} />, bg: 'bg-indigo-100', color: 'text-indigo-600', shadow: 'shadow-indigo-200' },
        test: { icon: <Award size={20} />, bg: 'bg-indigo-100', color: 'text-indigo-600', shadow: 'shadow-indigo-200' },
        announcement: { icon: <Megaphone size={20} />, bg: 'bg-amber-100', color: 'text-amber-600', shadow: 'shadow-amber-200' },
        schedule: { icon: <Calendar size={20} />, bg: 'bg-sky-100', color: 'text-sky-600', shadow: 'shadow-sky-200' },
        training: { icon: <Calendar size={20} />, bg: 'bg-sky-100', color: 'text-sky-600', shadow: 'shadow-sky-200' },
        default: { icon: <Bell size={20} />, bg: 'bg-slate-100', color: 'text-slate-600', shadow: 'shadow-slate-200' }
    };

    const config = configs[type] || configs.default;

    return (
        <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 ${config.bg} ${config.color} ${unread ? `shadow-lg ${config.shadow} scale-110` : 'opacity-60'}`}>
            {config.icon}
            {unread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white animate-pulse" />
            )}
        </div>
    );
};

// ── Main Page Implementation ──────────────────────────────────────────────────

export const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await academyService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Telemetric feed interrupted:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await academyService.markNotificationAsRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error('Sync failed for single entry:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await academyService.markAllNotificationsAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Batch sync failed:', error);
        }
    };

    const getNotificationType = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('fee')) return 'fee';
        if (lowerTitle.includes('performance') || lowerTitle.includes('test')) return 'performance';
        if (lowerTitle.includes('announcement')) return 'announcement';
        if (lowerTitle.includes('schedule') || lowerTitle.includes('training')) return 'schedule';
        return 'default';
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black tracking-widest rounded-full shadow-lg shadow-primary-500/30 uppercase">Neural Stream</span>
                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Clock size={12} />
                                Updated Live
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Glass Inbox</h1>
                        <p className="text-slate-500 font-medium">Coordinate your training experience with real-time protocol updates.</p>
                    </div>

                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black text-primary-600 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all active:scale-95"
                        >
                            <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
                            <span>CLEAR ALL UNREAD</span>
                        </button>
                    )}
                </div>

                {/* Notification Feed */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Filtering Signal...</span>
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification, idx) => (
                            <GlassCard 
                                key={notification.id} 
                                unread={!notification.is_read}
                                className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-start gap-6">
                                    <NotificationIcon 
                                        type={getNotificationType(notification.title)} 
                                        unread={!notification.is_read} 
                                    />
                                    
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`text-lg font-black tracking-tight truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-4 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                                {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-medium leading-relaxed ${!notification.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {notification.message}
                                        </p>
                                        
                                        <div className="flex items-center gap-6 pt-4">
                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest group/link"
                                                >
                                                    Inspect Details
                                                    <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                                                </Link>
                                            )}
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest underline decoration-slate-200 underline-offset-4"
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    ) : (
                        <GlassCard className="py-32 text-center border-dashed border-2 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <BellRing size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Zero Interferences</h3>
                            <p className="text-slate-400 font-medium max-w-sm mt-2">
                                Your neural stream is clear. We'll alert you when new training protocols or announcements are dispatched.
                            </p>
                            <div className="mt-8 px-4 py-2 bg-slate-50 rounded-xl flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Sparkles size={14} className="text-amber-400" />
                                System Optimal
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </Layout>
    );
};
