import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { academyService } from '../services';

export const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            loadNotifications();
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const data = await academyService.getNotifications();
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
            setNotifications(data.slice(0, 5)); // Keep latest 5
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    return (
        <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-gray-100 h-20 flex items-center">
            <div className="w-full px-4 sm:px-8 lg:px-12 flex justify-between items-center">
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <Menu size={22} />
                </button>

                {/* Subheader Title or Breadcrumb (Optional) */}
                <div className="hidden md:flex flex-1 ml-6">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight capitalize">
                        {window.location.pathname.split('/').pop() || 'Dashboard'}
                    </h2>
                </div>

                <div className="flex items-center space-x-6">
                    {/* User Profile Summary */}
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-black text-slate-900">{user?.first_name} {user?.last_name}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md">{user?.role}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-100 hidden sm:block"></div>

                    {/* Action Icons */}
                    <div className="flex items-center space-x-3">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`relative p-2.5 rounded-xl transition-all duration-300 ${isDropdownOpen ? 'bg-primary-50 text-primary-600' : 'bg-slate-50 text-slate-500 hover:text-primary-600 hover:bg-primary-50'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-4 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Alerts</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[9px] font-black uppercase text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">{unreadCount} New</span>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto w-full">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => { setIsDropdownOpen(false); navigate(notif.link || '/notifications'); }}
                                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary-50/30' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-xs font-bold truncate pr-3 ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1" />}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                                        {notif.message}
                                                    </p>
                                                    <div className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">
                                                        {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
                                                <p className="text-xs font-bold text-slate-500">Inbox Zero</p>
                                                <p className="text-[10px] text-slate-400 mt-1">You're all caught up!</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 bg-slate-50/50 border-t border-slate-100">
                                        <Link 
                                            to="/notifications" 
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="block w-full py-2 text-center text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                                        >
                                            View Neural Stream
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <Link
                            to="/profile"
                            className="p-1 rounded-xl group transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary-500/10 transition-all">
                                <img src={`https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=f8fafc&color=6366f1`} alt="Profile" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};
