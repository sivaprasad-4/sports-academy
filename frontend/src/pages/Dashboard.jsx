import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { academyService, performanceService } from '../services';
import { 
    Users, 
    Calendar, 
    TrendingUp, 
    Award, 
    Megaphone, 
    CreditCard, 
    ArrowRight,
    Search,
    ChevronRight,
    Activity,
    Target,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangelogModal } from '../components/ChangelogModal';

export const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalAthletes: 0,
        totalBatches: 0,
        totalSessions: 0,
        attendanceRate: 0,
        pendingFees: 0,
        performanceTests: 0
    });
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            if (user.role === 'ADMIN') {
                const [athletes, batches, attendance] = await Promise.all([
                    academyService.getAthletes(),
                    academyService.getBatches(),
                    academyService.getAttendanceSummary(),
                ]);

                setStats({
                    totalAthletes: athletes.length,
                    totalBatches: batches.length,
                    totalSessions: attendance.total_sessions || 0,
                    attendanceRate: attendance.overall_attendance_rate || 0,
                });
            } else if (user.role === 'COACH') {
                const [batches, attendance] = await Promise.all([
                    academyService.getBatches(),
                    academyService.getAttendanceSummary(),
                ]);

                const totalAthletes = batches.reduce((sum, b) => sum + b.athlete_count, 0);

                setStats({
                    totalAthletes: totalAthletes,
                    totalBatches: batches.length,
                    totalSessions: attendance.total_sessions || 0,
                    attendanceRate: attendance.overall_attendance_rate || 0,
                });
            } else if (user.role === 'ATHLETE') {
                const [attendance, performance, fees] = await Promise.all([
                    academyService.getAttendanceStats(user.id),
                    performanceService.getSummary(user.id),
                    academyService.getFees(),
                ]);

                const pending = Array.isArray(fees) 
                    ? fees.filter(f => f.status !== 'PAID').reduce((sum, f) => sum + parseFloat(f.amount), 0)
                    : 0;

                setStats({
                    totalSessions: attendance.total_sessions,
                    attendanceRate: attendance.attendance_percentage,
                    performanceTests: performance.reduce((sum, p) => sum + p.test_count, 0),
                    pendingFees: pending,
                });
            }
            const announcements = await academyService.getAnnouncements();
            setRecentAnnouncements(Array.isArray(announcements) ? announcements.slice(0, 3) : []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-2xl animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-2xl animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase animate-pulse">Synchronizing Data...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Hero Greeting Section */}
                <div className="relative overflow-hidden p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 blur-[100px] -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Zap size={12} className="fill-current" />
                                <span>Academy Status: Active</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                Welcome back, <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                                    {user.first_name}!
                                </span>
                            </h1>
                            <p className="text-slate-400 mt-4 max-w-lg font-medium leading-relaxed">
                                You have <span className="text-white font-bold">{stats.totalSessions} upcoming sessions</span> on your calendar. 
                                {user.role === 'ATHLETE' ? 'Your attendance ' : 'Athlete engagement '} 
                                is currently at <span className="text-emerald-400 font-bold">{stats.attendanceRate}%</span>.
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <Link 
                                to={user.role === 'ATHLETE' ? "/my-attendance" : "/attendance"} 
                                className="flex items-center space-x-2 px-6 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-white font-bold transition-all group"
                            >
                                <span>Analytics</span>
                                <TrendingUp size={18} className="text-primary-400 group-hover:scale-110 transition-transform" />
                            </Link>
                            <Link to="/schedules" className="flex items-center space-x-2 px-6 py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl text-white font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 group">
                                <span>Schedules</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Glass Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {user.role !== 'ATHLETE' && (
                        <>
                            <StatCard
                                icon={<Users size={24} />}
                                title={user.role === 'ADMIN' ? "Total Athletes" : "My Athletes"}
                                value={stats.totalAthletes}
                                trend="+12%"
                                color="text-primary-600"
                                bgColor="bg-primary-50"
                            />
                            <StatCard
                                icon={<Award size={24} />}
                                title={user.role === 'ADMIN' ? "Active Batches" : "My Batches"}
                                value={stats.totalBatches}
                                trend="On Target"
                                color="text-indigo-600"
                                bgColor="bg-indigo-50"
                            />
                            <StatCard
                                icon={<Activity size={24} />}
                                title="Avg Attendance"
                                value={`${stats.attendanceRate}%`}
                                trend="Steady"
                                color="text-emerald-600"
                                bgColor="bg-emerald-50"
                            />
                            <StatCard
                                icon={<Calendar size={24} />}
                                title="Upcoming Sessions"
                                value={stats.totalSessions}
                                trend="Active"
                                color="text-amber-600"
                                bgColor="bg-amber-50"
                            />
                        </>
                    )}
                    
                    {user.role === 'ATHLETE' && (
                        <>
                            <StatCard
                                icon={<Calendar size={24} />}
                                title="Upcoming Sessions"
                                value={stats.totalSessions}
                                trend="Active"
                                color="text-primary-600"
                                bgColor="bg-primary-50"
                            />
                            <StatCard
                                icon={<Activity size={24} />}
                                title="My Attendance"
                                value={`${stats.attendanceRate}%`}
                                trend="Steady"
                                color="text-emerald-600"
                                bgColor="bg-emerald-50"
                            />
                            <StatCard
                                icon={<CreditCard size={24} />}
                                title="Pending Fees"
                                value={`₹${stats.pendingFees}`}
                                trend="Due Soon"
                                color="text-rose-600"
                                bgColor="bg-rose-50"
                            />
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    {/* Announcement Feed */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recent Announcements</h2>
                            <Link to="/announcements" className="group flex items-center space-x-2 text-primary-600 font-bold text-sm">
                                <span>Full Notice Board</span>
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        
                        <div className="grid gap-4">
                            {recentAnnouncements.length > 0 ? (
                                recentAnnouncements.map((ann, idx) => (
                                    <div key={ann.id} className="group relative p-6 glass-card hover:bg-white transition-all overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex gap-5">
                                            <div className="p-4 bg-slate-50 rounded-2xl text-primary-600 group-hover:bg-primary-50 group-hover:scale-110 transition-all duration-500 h-fit shadow-sm">
                                                <Megaphone size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-bold text-slate-900 text-lg truncate group-hover:text-primary-600 transition-colors uppercase tracking-tight">{ann.title}</h3>
                                                    <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md font-black whitespace-nowrap uppercase tracking-widest">
                                                        {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 font-medium leading-relaxed mt-2 line-clamp-2">
                                                    {ann.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 glass-card">
                                    <Megaphone size={40} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Quiet Day in the Academy</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Launch Panel */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight px-2">Quick Launch</h2>
                        <div className="grid gap-3">
                            {user.role === 'ADMIN' && (
                                <>
                                    <QuickAction to="/athletes" label="Scouting" icon={<Search size={20} />} sub="Access player database" color="blue" />
                                    <QuickAction to="/attendance" label="Roster" icon={<Users size={20} />} sub="Log session attendance" color="emerald" />
                                    <QuickAction to="/performance" label="Lab" icon={<Activity size={20} />} sub="Manage performance tests" color="rose" />
                                </>
                            )}
                            {user.role === 'COACH' && (
                                <>
                                    <QuickAction to="/attendance" label="Roster" icon={<Users size={20} />} sub="Log session attendance" color="emerald" />
                                    <QuickAction to="/performance" label="Lab" icon={<Activity size={20} />} sub="Manage performance tests" color="rose" />
                                    <QuickAction to="/announcements" label="Notice Board" icon={<Megaphone size={20} />} sub="Post academy updates" color="indigo" />
                                </>
                            )}
                            {user.role === 'ATHLETE' && (
                                <>
                                    <QuickAction to="/my-performance" label="My Growth" icon={<Activity size={20} />} sub="View performance trends" color="blue" />
                                    <QuickAction to="/my-attendance" label="Attendance" icon={<Calendar size={20} />} sub="Check session logs" color="emerald" />
                                    <QuickAction to="/fees" label="Fees" icon={<CreditCard size={20} />} sub="View and pay fees" color="rose" />
                                    <QuickAction to="/announcements" label="Notice Board" icon={<Megaphone size={20} />} sub="View academy notices" color="indigo" />
                                </>
                            )}
                        </div>
                        
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h4 className="text-xl font-black mb-2 tracking-tight">System Upgrade</h4>
                            <p className="text-indigo-100 text-sm font-medium mb-6 opacity-80">v2.0 UI Overhaul is now live for all coaches and admins.</p>
                            <button 
                                onClick={() => setIsChangelogOpen(true)}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all text-sm"
                            >
                                View Changelog
                            </button>
                        </div>
                    </div>
                </div>

                <ChangelogModal 
                    isOpen={isChangelogOpen} 
                    onClose={() => setIsChangelogOpen(false)} 
                />
            </div>
        </Layout>
    );
};

const StatCard = ({ icon, title, value, trend, color, bgColor }) => (
    <div className="group glass-card p-7 hover-lift relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-full -mr-8 -mt-8"></div>
        <div className="flex items-start justify-between">
            <div className={`p-4 rounded-2xl ${bgColor} ${color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <div className="text-right">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${bgColor} ${color}`}>
                    {trend}
                </span>
            </div>
        </div>
        <div className="mt-6">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
    </div>
);

const QuickAction = ({ to, label, icon, sub, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100/50 hover:bg-blue-600 hover:text-white',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50 hover:bg-emerald-600 hover:text-white',
        rose: 'text-rose-600 bg-rose-50 border-rose-100/50 hover:bg-rose-600 hover:text-white',
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50 hover:bg-indigo-600 hover:text-white',
    };
    
    return (
        <Link
            to={to}
            className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-current/10 hover:-translate-y-1 group ${colors[color]}`}
        >
            <div className="p-3 bg-white rounded-xl shadow-sm transition-transform group-hover:rotate-12">
                {icon}
            </div>
            <div>
                <p className="font-black tracking-tight leading-none mb-1 uppercase text-xs">{label}</p>
                <p className="text-[10px] font-medium opacity-70 italic">{sub}</p>
            </div>
            <ChevronRight size={14} className="ml-auto opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
        </Link>
    );
};
