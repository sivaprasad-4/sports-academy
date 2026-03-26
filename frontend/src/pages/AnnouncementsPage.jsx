import { useEffect, useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { academyService } from '../services';
import { useAuth } from '../context/AuthContext';
import { 
    Megaphone, Plus, Trash2, Calendar, Users, X, 
    UserCheck, Globe, Bell, Shield, Hash,
    MoreVertical, ChevronRight, Zap, ArrowRight,
    MessageSquare, Info, AlertCircle, User, Target, ChevronDown
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "", highlight = false }) => (
    <div className={`relative bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${highlight ? 'ring-2 ring-primary-500/20' : ''} ${className}`}>
        {children}
    </div>
);

const AudienceBadge = ({ audience, targetCoachName, batchName }) => {
    const configs = {
        COACHES: { 
            label: targetCoachName ? `DIRECT: ${targetCoachName}` : 'COACH NETWORK', 
            styles: 'bg-violet-50 text-violet-600 border-violet-100',
            icon: <Shield size={12} />
        },
        ALL: { 
            label: 'GLOBAL BROADCAST', 
            styles: 'bg-amber-50 text-amber-600 border-amber-100',
            icon: <Globe size={12} />
        },
        ATHLETES: { 
            label: batchName ? `BATCH: ${batchName}` : 'ATHLETE ROSTER', 
            styles: 'bg-blue-50 text-blue-600 border-blue-100',
            icon: <Users size={12} />
        }
    };

    const config = configs[audience] || configs.ATHLETES;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${config.styles} shadow-sm`}>
            {config.icon}
            {config.label}
        </span>
    );
};

// ── Main Page Implementation ──────────────────────────────────────────────────

export const AnnouncementsPage = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [batches, setBatches] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        batch: '',
        target_audience: 'ATHLETES',
        target_coach: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const promises = [academyService.getAnnouncements()];
            if (user.role !== 'ATHLETE') promises.push(academyService.getBatches());
            if (user.role === 'ADMIN') promises.push(academyService.getCoachesList());

            const results = await Promise.all(promises);
            setAnnouncements(Array.isArray(results[0]) ? results[0] : []);
            if (results[1]) setBatches(results[1]);
            if (results[2]) setCoaches(results[2]);
        } catch (error) {
            console.error('Chronicle downlink failure:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const data = {
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                target_audience: newAnnouncement.target_audience,
            };

            if (newAnnouncement.target_audience === 'ATHLETES' && newAnnouncement.batch) {
                data.batch = newAnnouncement.batch;
            }
            if (newAnnouncement.target_audience === 'COACHES' && newAnnouncement.target_coach) {
                data.target_coach = newAnnouncement.target_coach;
            }

            await academyService.createAnnouncement(data);
            setShowCreateModal(false);
            setNewAnnouncement({ title: '', content: '', batch: '', target_audience: 'ATHLETES', target_coach: '' });
            loadData();
        } catch (error) {
            console.error('Broadcast failed:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Execute deletion protocol for this entry?')) return;
        try {
            await academyService.deleteAnnouncement(id);
            loadData();
        } catch (error) {
            console.error('Erasure failed:', error);
        }
    };

    const filteredAnnouncements = useMemo(() => {
        if (activeTab === 'ALL') return announcements;
        return announcements.filter(ann => ann.target_audience === activeTab);
    }, [announcements, activeTab]);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black tracking-widest rounded-full shadow-lg shadow-amber-500/30 uppercase">Live Chronicle</span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Academy Updates</h1>
                        <p className="text-slate-500 font-medium max-w-xl">
                            The central record of protocol changes, training instructions, and high-priority transmissions.
                        </p>
                    </div>

                    {(user.role === 'ADMIN' || user.role === 'COACH') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/20 hover:bg-primary-600 transition-all active:scale-95"
                        >
                            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>BROADCAST CONSOLE</span>
                        </button>
                    )}
                </div>

                {/* Filter Matrix */}
                {user.role === 'ADMIN' && (
                    <div className="flex flex-wrap gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                        {[
                            { id: 'ALL', label: 'THE CHRONICLE', icon: <Hash size={14} /> },
                            { id: 'COACHES', label: 'COACH NETWORK', icon: <Shield size={14} /> },
                            { id: 'ATHLETES', label: 'ATHLETE FEED', icon: <Users size={14} /> },
                            { id: 'ALL_AUDIENCE', label: 'GLOBAL', icon: <Globe size={14} />, value: 'ALL' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.value || tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                                    (tab.value || tab.id) === activeTab 
                                        ? 'bg-white shadow-xl text-primary-600' 
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Announcement Chronicle Feed */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing feed...</span>
                    </div>
                ) : filteredAnnouncements.length > 0 ? (
                    <div className="relative space-y-8">
                        {/* Timeline Spine */}
                        <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200 hidden lg:block" />
                        
                        {filteredAnnouncements.map((ann, idx) => (
                            <div key={ann.id} className="relative group lg:pl-24 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Timeline Dot */}
                                <div className="absolute left-8 top-8 w-4 h-4 bg-white border-4 border-slate-200 rounded-full hidden lg:block group-hover:border-primary-500 transition-colors z-10" />
                                
                                <GlassCard 
                                    className={`relative overflow-hidden ${ann.target_audience === 'COACHES' ? 'border-l-8 border-l-violet-500' : 'border-l-8 border-l-primary-500'}`}
                                    highlight={ann.target_audience === 'COACHES'}
                                >
                                    {/* Design Decor */}
                                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
                                    
                                    <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                        <div className="flex-1 space-y-6">
                                            {/* Top Meta */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <AudienceBadge 
                                                    audience={ann.target_audience} 
                                                    targetCoachName={ann.target_coach_name} 
                                                    batchName={ann.batch_name} 
                                                />
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">
                                                    <Calendar size={12} />
                                                    {ann?.created_at ? new Date(ann.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Transmission Date Unknown'}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-4">
                                                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">{ann.title}</h3>
                                                <div className="prose prose-slate max-w-none">
                                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                                                        {ann?.content || 'No transmission content available.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bottom Meta */}
                                            <div className="flex items-center gap-6 pt-4 border-t border-slate-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User size={16} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dispatcher</p>
                                                        <p className="text-sm font-bold text-slate-700 mt-0.5">{ann.target_audience === 'COACHES' ? 'Academy Admin' : ann.coach_name}</p>
                                                    </div>
                                                </div>
                                                
                                                {ann.batch_name && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                            <Target size={16} className="text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Target Group</p>
                                                            <p className="text-sm font-bold text-slate-700 mt-0.5">{ann.batch_name}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Sidebar */}
                                        <div className="flex md:flex-col justify-end gap-3 self-end md:self-start">
                                            {(user.role === 'ADMIN' || (user.role === 'COACH' && ann.coach === user.id)) && (
                                                <button
                                                    onClick={() => handleDelete(ann.id)}
                                                    className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                            <button className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-sm">
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        ))}
                    </div>
                ) : (
                    <GlassCard className="py-32 text-center border-dashed border-2 flex flex-col items-center">
                        <Megaphone size={64} className="text-slate-100 mb-6" />
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Chronicle Empty</h3>
                        <p className="text-slate-400 font-medium max-w-sm mt-3">
                            No active transmissions found in the academy record. New protocols will appear here as they are dispatched.
                        </p>
                    </GlassCard>
                )}

                {/* Broadcast Console Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                        <Megaphone size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Broadcast Console</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global dispatch system</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreate} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transmission Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 py-4 font-bold text-slate-800 placeholder:text-slate-300"
                                                placeholder="e.g., Training Schedule Alpha-4"
                                                value={newAnnouncement.title}
                                                onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Focus</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: 'ATHLETES', label: 'ATHLETES', icon: <Users size={14} /> },
                                                    { value: 'COACHES', label: 'COACHES', icon: <Shield size={14} /> },
                                                    { value: 'ALL', label: 'GLOBAL', icon: <Globe size={14} /> },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setNewAnnouncement({ ...newAnnouncement, target_audience: opt.value, batch: '', target_coach: '' })}
                                                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2 transition-all ${
                                                            newAnnouncement.target_audience === opt.value
                                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                                : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                                        }`}
                                                    >
                                                        {opt.icon}
                                                        <span className="text-[8px] font-black">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Targeted Routing */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.role !== 'ATHLETE' && newAnnouncement.target_audience !== 'COACHES' && (
                                            <CustomSelect
                                                label="Batch Routing (Optional)"
                                                placeholder="Global Broadcast (Academy-Wide)"
                                                icon={Users}
                                                options={batches.map(b => ({ value: b.id, label: `${b.name} – ${b.sport_name}` }))}
                                                value={newAnnouncement.batch}
                                                onChange={e => setNewAnnouncement({...newAnnouncement, batch: e.target.value})}
                                            />
                                        )}

                                        {user.role === 'ADMIN' && newAnnouncement.target_audience === 'COACHES' && (
                                            <CustomSelect
                                                label="Direct Coach (Optional)"
                                                placeholder="Full Coach Network"
                                                icon={Shield}
                                                options={coaches.map(c => ({ value: c.id, label: `${c.first_name || c.username} (${c.username})` }))}
                                                value={newAnnouncement.target_coach}
                                                onChange={e => setNewAnnouncement({...newAnnouncement, target_coach: e.target.value})}
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Neural Message</label>
                                        <textarea
                                            required
                                            rows={6}
                                            className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary-500 p-5 font-medium text-slate-700 placeholder:text-slate-300 leading-relaxed"
                                            placeholder="Specify transmission details or protocol updates..."
                                            value={newAnnouncement.content}
                                            onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-8 py-4 border border-slate-100 text-slate-400 font-black rounded-3xl hover:bg-slate-50 transition-all"
                                    >
                                        ABORT
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-primary-600 text-white font-black rounded-3xl hover:bg-primary-500 shadow-2xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <Zap size={22} className="fill-white" />
                                        <span>INITIATE BROADCAST</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
