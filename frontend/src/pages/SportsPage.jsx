import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { academyService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Award, Plus, Trash2, Trophy, Target, Zap, Activity, Shield, X, Info } from 'lucide-react';

const SPORT_THEMES = [
    { from: 'from-blue-500', to: 'to-indigo-600', icon: Trophy, bg: 'bg-blue-50' },
    { from: 'from-emerald-500', to: 'to-teal-600', icon: Target, bg: 'bg-emerald-50' },
    { from: 'from-amber-500', to: 'to-orange-600', icon: Zap, bg: 'bg-amber-50' },
    { from: 'from-rose-500', to: 'to-pink-600', icon: Activity, bg: 'bg-rose-50' },
    { from: 'from-purple-500', to: 'to-violet-600', icon: Shield, bg: 'bg-purple-50' },
];

export const SportsPage = () => {
    const { user } = useAuth();
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSport, setNewSport] = useState({ name: '', description: '' });

    useEffect(() => {
        loadSports();
    }, []);

    const loadSports = async () => {
        try {
            const data = await academyService.getSports();
            setSports(data);
        } catch (error) {
            console.error('Failed to load sports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSport = async (e) => {
        e.preventDefault();
        try {
            await academyService.createSport(newSport);
            setNewSport({ name: '', description: '' });
            setShowModal(false);
            loadSports();
        } catch (error) {
            console.error('Failed to create sport:', error);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="space-y-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative glass-card p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 border-white/40">
                        <div className="flex items-center space-x-8">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary-500/20 rounded-2xl blur-lg animate-pulse"></div>
                                <div className="relative w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                                    <Award className="text-primary-400" size={40} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3 uppercase">
                                    Sports <span className="text-primary-600">Gallery</span>
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-slate-400 space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Academy Disciplines</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                        Total Capacity: {sports.length} Active Modules
                                    </p>
                                </div>
                            </div>
                        </div>

                        {user.role === 'ADMIN' && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                            >
                                <Plus size={20} />
                                <span>Initialize Discipline</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sports Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sports.map((sport, index) => {
                        const theme = SPORT_THEMES[index % SPORT_THEMES.length];
                        const Icon = theme.icon;
                        return (
                            <div key={sport.id} className="relative group perspective">
                                <div className={`absolute -inset-0.5 bg-gradient-to-br ${theme.from} ${theme.to} rounded-[2.5rem] blur opacity-0 group-hover:opacity-10 transition duration-500`}></div>
                                <div className="relative glass-card h-80 p-10 border-white/40 group-hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
                                    {/* Abstract background element */}
                                    <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-gradient-to-br ${theme.from} ${theme.to} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-3xl transition-opacity duration-700`}></div>
                                    
                                    <div className="relative flex justify-between items-start mb-8">
                                        <div className={`p-5 ${theme.bg} rounded-[1.5rem] shadow-xl shadow-slate-200/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                            <Icon className={`text-slate-800`} size={32} />
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-500 flex items-center justify-center text-[8px] font-black text-white">
                                                +9
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative mt-auto">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${theme.from} ${theme.to}`}></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discipline {index + 1}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">{sport.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">
                                            {sport.description || 'Structural parameters for this athletic discipline are currently established for development.'}
                                        </p>
                                        <div className="flex items-center space-x-4">
                                            <button className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] hover:text-primary-700 transition-colors flex items-center space-x-2 group/btn">
                                                <span>View Strategy</span>
                                                <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {sports.length === 0 && (
                    <div className="glass-card py-32 text-center border-dashed border-2 border-slate-200">
                        <Award size={64} className="mx-auto text-slate-200 mb-8" />
                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-3">Gallery Empty</h3>
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Initialize the first discipline to begin academy operations.</p>
                    </div>
                )}

                {/* Modal Redesign */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
                        <div className="glass-card max-w-lg w-full p-10 border-white/50 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center space-x-6 mb-10">
                                <div className="w-16 h-16 bg-primary-100/50 rounded-2xl flex items-center justify-center">
                                    <Plus className="text-primary-600" size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Discipline</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Strategic expansion protocols</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateSport} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identify Sport</label>
                                    <input
                                        type="text"
                                        value={newSport.name}
                                        onChange={(e) => setNewSport({ ...newSport, name: e.target.value })}
                                        className="w-full bg-slate-900/5 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300"
                                        placeholder="e.g., QUANTUM BASKETBALL"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Scope</label>
                                        <Info size={12} className="text-slate-300" />
                                    </div>
                                    <textarea
                                        value={newSport.description}
                                        onChange={(e) => setNewSport({ ...newSport, description: e.target.value })}
                                        className="w-full bg-slate-900/5 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all h-32 resize-none placeholder:text-slate-300"
                                        placeholder="Define the core objectives and metrics for this discipline..."
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Commit Discipline
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
