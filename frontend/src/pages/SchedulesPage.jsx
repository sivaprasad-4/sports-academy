import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { academyService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Clock, Plus, Filter, CheckCircle, CheckCircle2, XCircle, User, Edit2, X, Activity, Sun, Moon, MapPin, ChevronRight, Hash, CheckSquare, Zap } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

export const SchedulesPage = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null); // null = create mode, session obj = edit mode
    const [filterBatch, setFilterBatch] = useState('');
    const [coaches, setCoaches] = useState([]);
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        batch: '',
        coach: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '08:00',
        topic: '',
        notes: '',
        is_cancelled: false,
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        loadData();
    }, [filterBatch]);

    const loadData = async () => {
        try {
            const params = filterBatch ? { batch: filterBatch } : {};
            const [scheduleData, batchData, coachData] = await Promise.all([
                academyService.getSchedules(params),
                academyService.getBatches(),
                academyService.getCoaches()
            ]);
            setSchedules(scheduleData);
            setBatches(batchData);
            setCoaches(coachData);
        } catch (error) {
            console.error('Failed to load schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingSession(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const handleOpenEdit = (session) => {
        setEditingSession(session);
        setFormData({
            batch: session.batch,
            coach: session.coach || '',
            date: session.date,
            start_time: session.start_time.slice(0, 5),
            end_time: session.end_time.slice(0, 5),
            topic: session.topic || '',
            notes: session.notes || '',
            is_cancelled: session.is_cancelled,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingSession) {
                await academyService.updateSchedule(editingSession.id, formData);
            } else {
                await academyService.createSchedule(formData);
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to save schedule:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkCompleted = async (id) => {
        if (!window.confirm("Are you sure you want to mark this session as completed?")) return;
        setSaving(true);
        try {
            await academyService.updateSchedule(id, { is_completed: true });
            loadData();
        } catch (error) {
            console.error('Failed to mark as completed:', error);
        } finally {
            setSaving(false);
        }
    };

    const canEditSession = (session) => {
        if (user.role === 'ADMIN') return true;
        if (user.role === 'COACH') {
            // Either this coach is the assigned session coach, or the batch coach
            const batch = batches.find(b => b.id === session.batch);
            return session.coach === user.id || (batch && batch.coach === user.id);
        }
        return false;
    };

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = schedules.filter(s => s.date === today).length;
    const cancelledSessions = schedules.filter(s => s.is_cancelled).length;

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-xl animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-xl animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase text-center">Calibrating Training Rhythms...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
                {/* Header & Stats Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training Schedule</h1>
                        <p className="text-slate-500 font-medium mt-1">Navigate the academy's chronological pulse.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <StatSummary 
                            label="Total" 
                            value={schedules.length} 
                            icon={<CalendarIcon size={18} />} 
                            color="text-primary-600" 
                            bgColor="bg-primary-50" 
                        />
                        <StatSummary 
                            label="Today" 
                            value={todaySessions} 
                            icon={<Activity size={18} />} 
                            color="text-emerald-600" 
                            bgColor="bg-emerald-50" 
                        />
                        <StatSummary 
                            label="Completed" 
                            value={schedules.filter(s => s.is_completed).length} 
                            icon={<CheckSquare size={18} />} 
                            color="text-indigo-600" 
                            bgColor="bg-indigo-50" 
                        />
                        <StatSummary 
                            label="Cancelled" 
                            value={cancelledSessions} 
                            icon={<XCircle size={18} />} 
                            color="text-rose-600" 
                            bgColor="bg-rose-50" 
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-2 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center space-x-2 pl-4">
                        {user?.role === 'ADMIN' ? (
                            <div className="flex items-center space-x-3">
                                <CustomSelect
                                    placeholder="All Active Batches"
                                    icon={Filter}
                                    options={[
                                        { value: '', label: 'All Active Batches' },
                                        ...batches.map(b => ({ value: b.id, label: b.name }))
                                    ]}
                                    value={filterBatch}
                                    onChange={(e) => setFilterBatch(e.target.value)}
                                    className="min-w-[200px]"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <CalendarIcon size={18} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Training Itinerary</span>
                            </div>
                        )}
                    </div>

                    {(user.role === 'ADMIN' || user.role === 'COACH') && (
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            <Plus size={18} />
                            <span>Schedule Session</span>
                        </button>
                    )}
                </div>

                {/* Schedule Timeline/List */}
                <div className="space-y-6">
                    {schedules.map((session) => {
                        const isToday = session.date === today;
                        const isCompleted = session.is_completed;
                        return (
                            <div key={session.id} className={`group glass-card p-6 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden transition-all duration-300 ${
                                session.is_cancelled || isCompleted ? 'opacity-60 grayscale-[0.5]' : 'hover:border-primary-200'
                            }`}>
                                {/* Date Badge */}
                                <div className="flex-shrink-0 flex md:flex-col items-center justify-center w-24 h-24 md:w-20 md:h-20 bg-slate-50 rounded-3xl border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary-600">
                                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 leading-none group-hover:text-primary-600">
                                        {new Date(session.date).getDate()}
                                    </p>
                                    {isToday && (
                                        <div className="mt-1 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full">TODAY</div>
                                    )}
                                </div>

                                {/* Session core info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center space-x-1.5 ${
                                            session.session_type === 'MORNING' 
                                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        }`}>
                                            {session.session_type === 'MORNING' ? <Sun size={10} /> : <Moon size={10} />}
                                            <span>{session.session_type}</span>
                                        </span>
                                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg text-[9px] font-black tracking-widest uppercase">
                                            {session.batch_name}
                                        </span>
                                        {session.is_cancelled && (
                                            <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center space-x-1">
                                                <XCircle size={10} />
                                                <span>Session Cancelled</span>
                                            </span>
                                        )}
                                        {isCompleted && !session.is_cancelled && (
                                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center space-x-1">
                                                <CheckSquare size={10} />
                                                <span>Session Completed</span>
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-primary-600 transition-colors">
                                        {session.topic || 'General Training Protocol'}
                                    </h3>

                                    <div className="flex flex-wrap gap-4">
                                        <ScheduleMetric icon={<Clock size={14} />} text={`${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`} />
                                        <ScheduleMetric icon={<User size={14} />} text={session.coach_name || 'Assigned Lead'} />
                                        {session.notes && <ScheduleMetric icon={<MapPin size={14} />} text="Indoor Facility A" />}
                                    </div>
                                </div>

                                {/* Actions & Status */}
                                <div className="flex items-center justify-between md:justify-end gap-3 mt-4 md:mt-0">
                                    {!session.is_cancelled && !isCompleted && (
                                        <div className="flex items-center space-x-2 text-emerald-600 mr-2">
                                            <CheckCircle2 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                        </div>
                                    )}
                                    
                                    {canEditSession(session) && !isCompleted && !session.is_cancelled && (
                                        <button
                                            onClick={() => handleMarkCompleted(session.id)}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 border border-indigo-100/50"
                                            title="Mark as Completed"
                                        >
                                            <CheckSquare size={14} />
                                            <span>Complete</span>
                                        </button>
                                    )}
                                    
                                    {canEditSession(session) && !isCompleted && (
                                        <button
                                            onClick={() => handleOpenEdit(session)}
                                            className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Edit Session"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {schedules.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 glass-card text-center space-y-4">
                            <CalendarIcon size={48} className="text-slate-200" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Quiet on the Court</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">No sessions currently scheduled for the selected parameters.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Session Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                            {editingSession ? 'Edit Ritual' : 'New Session'}
                                        </h2>
                                        <p className="text-slate-500 font-medium mt-1">Define training objectives and timing.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowModal(false)} 
                                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                                <CustomSelect
                                                    label="Target Batch"
                                                    icon={Zap}
                                                    placeholder="Select Target..."
                                                    options={batches
                                                        .filter(b => user.role === 'ADMIN' || (user.role === 'COACH' && b.coach === user.id))
                                                        .map(b => ({ value: b.id, label: b.name }))
                                                    }
                                                    value={formData.batch}
                                                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                                    disabled={!!editingSession}
                                                />
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                            <CustomSelect
                                                label="Assigned Coach"
                                                icon={User}
                                                placeholder="Use Default Batch Coach"
                                                options={coaches.map(c => ({ 
                                                    value: c.user.id, 
                                                    label: `${c.user.first_name} ${c.user.last_name}` 
                                                }))}
                                                value={formData.coach}
                                                onChange={(e) => setFormData({ ...formData, coach: e.target.value })}
                                            />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement</label>
                                                <input
                                                    type="time"
                                                    value={formData.start_time}
                                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conclusion</label>
                                                <input
                                                    type="time"
                                                    value={formData.end_time}
                                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Training Objective</label>
                                            <input
                                                type="text"
                                                value={formData.topic}
                                                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                placeholder="e.g., Aggressive Base Running & Sliding"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Notes</label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none h-24 resize-none"
                                                placeholder="Focus on footwork and recovery timing..."
                                            />
                                        </div>

                                        {editingSession && (
                                            <div 
                                                onClick={() => setFormData({ ...formData, is_cancelled: !formData.is_cancelled })}
                                                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between group ${
                                                    formData.is_cancelled 
                                                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                                    : 'bg-slate-50 border-transparent text-slate-400 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <XCircle size={18} className={formData.is_cancelled ? 'text-rose-500' : 'text-slate-400'} />
                                                    <span className="text-xs font-black uppercase tracking-widest">Abort Session</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    formData.is_cancelled ? 'bg-rose-500 border-rose-500' : 'border-slate-300'
                                                }`}>
                                                    {formData.is_cancelled && <CheckCircle size={12} className="text-white" />}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                            disabled={saving}
                                        >
                                            Retreat
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex-1"
                                            disabled={saving}
                                        >
                                            {saving ? 'Synchronizing...' : (editingSession ? 'Update Record' : 'Commit Schedule')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const StatSummary = ({ label, value, icon, color, bgColor }) => (
    <div className="flex items-center space-x-3 px-5 py-3 glass-card">
        <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

const ScheduleMetric = ({ icon, text }) => (
    <div className="flex items-center text-slate-400 space-x-2">
        <span className="text-slate-300">{icon}</span>
        <span className="text-xs font-bold leading-none">{text}</span>
    </div>
);
