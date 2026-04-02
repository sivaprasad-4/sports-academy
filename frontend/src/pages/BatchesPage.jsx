import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { academyService, performanceService } from '../services';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Calendar, Clock, Edit2, User, ExternalLink, Activity, Sun, Moon, CheckCircle2, ChevronRight, X, Zap } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { AthleteDetailModal } from '../components/AthleteDetailModal';

export const BatchesPage = () => {
    const { user } = useAuth();
    const [batches, setBatches] = useState([]);
    const [sports, setSports] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState(null);
    const [batchFormData, setBatchFormData] = useState({
        name: '',
        sport: '',
        coach: '',
        session_type: 'MORNING',
        start_time: '06:00',
        end_time: '08:00',
        days_of_week: 'Mon,Wed,Fri'
    });

    // States for Manage Athletes modal
    const [showManageModal, setShowManageModal] = useState(false);
    const [managingBatchId, setManagingBatchId] = useState(null);
    const [availableAthletes, setAvailableAthletes] = useState([]);
    const [currentBatchAthletes, setCurrentBatchAthletes] = useState([]);
    const [selectedAthleteToAdd, setSelectedAthleteToAdd] = useState('');
    const [manageLoading, setManageLoading] = useState(false);
    
    // States for Athlete Profile Detail
    const [selectedAthleteIdForProfile, setSelectedAthleteIdForProfile] = useState(null);
    const [showAthleteProfileModal, setShowAthleteProfileModal] = useState(false);
    const [manageModalWasOpen, setManageModalWasOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [batchData, sportData, coachData] = await Promise.all([
                academyService.getBatches(),
                academyService.getSports(),
                academyService.getCoaches()
            ]);
            setBatches(batchData);
            setSports(sportData);
            setCoaches(coachData);
        } catch (error) {
            console.error('Failed to load batches data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenManageModal = async (batch) => {
        setManagingBatchId(batch.id);
        setShowManageModal(true);
        setManageLoading(true);
        setSelectedAthleteToAdd('');
        try {
            const [allAthletes, batchAthletes] = await Promise.all([
                academyService.getAthletes(),
                academyService.getBatchAthletes(batch.id)
            ]);
            setAvailableAthletes(allAthletes);
            setCurrentBatchAthletes(batchAthletes);
        } catch (error) {
            console.error('Failed to load athletes data:', error);
        } finally {
            setManageLoading(false);
        }
    };

    const handleAddAthlete = async () => {
        if (!selectedAthleteToAdd || !managingBatchId) return;
        setManageLoading(true);
        try {
            await academyService.addAthletesToBatch(managingBatchId, [parseInt(selectedAthleteToAdd)]);
            // Reload the athletes list for the modal and batches list for the main count
            const batchAthletes = await academyService.getBatchAthletes(managingBatchId);
            setCurrentBatchAthletes(batchAthletes);
            setSelectedAthleteToAdd('');
            loadData(); // To update the batch count on the card
        } catch (error) {
            console.error('Failed to add athlete:', error);
            console.error('Failed to add athlete. Check permissions or try again.');
        } finally {
            setManageLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingBatchId(null);
        setBatchFormData({
            name: '',
            sport: '',
            coach: '',
            session_type: 'MORNING',
            start_time: '06:00',
            end_time: '08:00',
            days_of_week: 'Mon,Wed,Fri'
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (batch) => {
        setEditingBatchId(batch.id);
        setBatchFormData({
            name: batch.name,
            sport: batch.sport,
            coach: batch.coach || '',
            session_type: batch.session_type || 'MORNING',
            start_time: batch.start_time.slice(0, 5), // Format HH:MM
            end_time: batch.end_time.slice(0, 5),
            days_of_week: batch.days_of_week
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBatchId) {
                await academyService.updateBatch(editingBatchId, batchFormData);
            } else {
                await academyService.createBatch(batchFormData);
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to save batch:', error);
        }
    };

    const morningBatches = batches.filter(b => b.session_type === 'MORNING').length;
    const eveningBatches = batches.filter(b => b.session_type === 'EVENING').length;

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-xl animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-xl animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase text-center">Synchronizing Schedules...</p>
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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Training Batches</h1>
                        <p className="text-slate-500 font-medium mt-1">Orchestrate academy rhythms and coaching assignments.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <StatSummary 
                            label="Total" 
                            value={batches.length} 
                            icon={<Activity size={18} />} 
                            color="text-primary-600" 
                            bgColor="bg-primary-50" 
                        />
                        <StatSummary 
                            label="Morning" 
                            value={morningBatches} 
                            icon={<Sun size={18} />} 
                            color="text-amber-600" 
                            bgColor="bg-amber-50" 
                        />
                        <StatSummary 
                            label="Evening" 
                            value={eveningBatches} 
                            icon={<Moon size={18} />} 
                            color="text-indigo-600" 
                            bgColor="bg-indigo-50" 
                        />
                        {user.role === 'ADMIN' && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="flex items-center space-x-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                <span>New Batch</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Batch Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {batches.map((batch) => {
                        const canEdit = user.role === 'ADMIN' || (user.role === 'COACH' && batch.coach === user.id);

                        return (
                            <div key={batch.id} className="group glass-card hover-lift p-6 relative overflow-hidden flex flex-col">
                                {/* Session Type Accent */}
                                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity blur-2xl ${
                                    batch.session_type === 'MORNING' ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}></div>
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white border border-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            {batch.sport_name}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center space-x-1.5 ${
                                            batch.session_type === 'MORNING'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                        }`}>
                                            {batch.session_type === 'MORNING' ? <Sun size={10} /> : <Moon size={10} />}
                                            <span>{batch.session_type}</span>
                                        </span>
                                    </div>
                                    
                                    {canEdit && (
                                        <button
                                            onClick={() => handleOpenEditModal(batch)}
                                            className="p-2 text-slate-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Edit Batch"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4 group-hover:text-primary-600 transition-colors">
                                    {batch.name}
                                </h3>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <ScheduleDetail icon={<Clock size={16} />} label="Timing" value={`${batch.start_time.slice(0, 5)} - ${batch.end_time.slice(0, 5)}`} />
                                    <ScheduleDetail icon={<Users size={16} />} label="Enrolled" value={`${batch.athlete_count} Athletes`} />
                                </div>

                                <div className="flex items-center space-x-3 mb-8 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lead Coach</p>
                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                                            {batch.coach_name || 'Unassigned'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center text-[11px] font-bold text-slate-400">
                                        <Calendar size={14} className="mr-2 text-slate-300" />
                                        <span>{batch.days_of_week}</span>
                                    </div>

                                    {(user.role === 'ADMIN' || user.role === 'COACH') && (
                                        <button
                                            onClick={() => handleOpenManageModal(batch)}
                                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 group/btn"
                                        >
                                            <span>{user.role === 'ADMIN' ? 'Manage Roster' : 'View Athletes'}</span>
                                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {batches.length === 0 && (
                        <div className="col-span-full py-20 glass-card text-center">
                            <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Batches Defined</h3>
                            <p className="text-slate-400 font-medium">Get started by creating a new training rhythm.</p>
                        </div>
                    )}
                </div>

                {/* Batch Form Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] max-w-md w-full p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                            {editingBatchId ? 'Edit Batch' : 'New Batch'}
                                        </h2>
                                        <p className="text-slate-500 font-medium mt-1">Define schedule and assignment.</p>
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
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Identifier</label>
                                            <input
                                                type="text"
                                                value={batchFormData.name}
                                                onChange={(e) => setBatchFormData({ ...batchFormData, name: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                placeholder="e.g., Elite Cricket Morning"
                                                required
                                            />
                                        </div>

                                        {user.role === 'ADMIN' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <CustomSelect
                                                    label="Sport Discipline"
                                                    icon={Activity}
                                                    placeholder="Select Sport"
                                                    options={sports.map(s => ({ value: s.id, label: s.name }))}
                                                    value={batchFormData.sport}
                                                    onChange={(e) => setBatchFormData({ ...batchFormData, sport: e.target.value })}
                                                />
                                                <CustomSelect
                                                    label="Assigned Coach"
                                                    icon={User}
                                                    placeholder="Optional"
                                                    options={coaches.map(c => ({ value: c.user.id, label: `${c.user.first_name} ${c.user.last_name}` }))}
                                                    value={batchFormData.coach}
                                                    onChange={(e) => setBatchFormData({ ...batchFormData, coach: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Protocol</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setBatchFormData({ ...batchFormData, session_type: 'MORNING' })}
                                                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                                                        batchFormData.session_type === 'MORNING' 
                                                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' 
                                                        : 'bg-slate-50 text-slate-400 border-2 border-transparent'
                                                    }`}
                                                >
                                                    <Sun size={14} />
                                                    <span>Morning</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBatchFormData({ ...batchFormData, session_type: 'EVENING' })}
                                                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                                                        batchFormData.session_type === 'EVENING' 
                                                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200' 
                                                        : 'bg-slate-50 text-slate-400 border-2 border-transparent'
                                                    }`}
                                                >
                                                    <Moon size={14} />
                                                    <span>Evening</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={batchFormData.start_time}
                                                    onChange={(e) => setBatchFormData({ ...batchFormData, start_time: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                                <input
                                                    type="time"
                                                    value={batchFormData.end_time}
                                                    onChange={(e) => setBatchFormData({ ...batchFormData, end_time: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Days of Operation</label>
                                            <input
                                                type="text"
                                                value={batchFormData.days_of_week}
                                                onChange={(e) => setBatchFormData({ ...batchFormData, days_of_week: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none"
                                                placeholder="Mon, Tue, Wed..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex-1"
                                        >
                                            {editingBatchId ? 'Apply Changes' : 'Initialize Batch'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Athletes Modal */}
                {showManageModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                            {user.role === 'ADMIN' ? 'Manage Roster' : 'Athlete Directory'}
                                        </h2>
                                        <p className="text-slate-500 font-medium">Curate the community within this batch.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowManageModal(false)} 
                                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {manageLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-xl animate-spin"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refreshing Roster...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {user.role === 'ADMIN' && (
                                            <section>
                                                <div className="flex items-center space-x-3 mb-6">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                        <Plus size={16} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Enlist Athletes</h3>
                                                </div>
                                                
                                                <div className="flex gap-3">
                                                    <CustomSelect
                                                        placeholder="Select Athlete to Onboard..."
                                                        icon={User}
                                                        options={availableAthletes
                                                            .filter(a => a.batch !== managingBatchId)
                                                            .map(a => ({ 
                                                                value: a.id, 
                                                                label: `${a.user.first_name} ${a.user.last_name} ${a.batch_name ? `• ${a.batch_name}` : ''}` 
                                                            }))}
                                                        value={selectedAthleteToAdd}
                                                        onChange={(e) => setSelectedAthleteToAdd(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <button
                                                        onClick={handleAddAthlete}
                                                        disabled={!selectedAthleteToAdd}
                                                        className="px-6 py-4 bg-primary-600 disabled:bg-slate-200 hover:bg-primary-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/10 active:scale-95"
                                                    >
                                                        Enlist
                                                    </button>
                                                </div>
                                            </section>
                                        )}

                                        <section>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                        <Users size={16} />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Assigned Force</h3>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{currentBatchAthletes.length} Total</span>
                                            </div>

                                            {currentBatchAthletes.length === 0 ? (
                                                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                    <Users size={32} className="mx-auto text-slate-200 mb-2" />
                                                    <p className="text-xs font-bold text-slate-400">No athletes assigned yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {currentBatchAthletes.map(athlete => (
                                                        <div key={athlete.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group/row hover:border-primary-100 transition-colors">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                                    <User size={18} />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-sm font-bold text-slate-900 truncate">
                                                                        {athlete.user.first_name} {athlete.user.last_name}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 truncate font-medium">{athlete.user.email}</p>
                                                                </div>
                                                            </div>
                                                            {athlete.user && user.role !== 'ADMIN' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAthleteIdForProfile(athlete.user.id);
                                                                        // Hide manage modal first so it doesn't block the profile
                                                                        setManageModalWasOpen(true);
                                                                        setShowManageModal(false);
                                                                        setShowAthleteProfileModal(true);
                                                                    }}
                                                                    className="p-3 text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm shadow-primary-500/5 group/link"
                                                                    title={`View ${athlete.user.first_name}'s Profile`}
                                                                >
                                                                    <ExternalLink size={18} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <AthleteDetailModal 
                    athleteId={selectedAthleteIdForProfile}
                    isOpen={showAthleteProfileModal}
                    onClose={() => {
                        setShowAthleteProfileModal(false);
                        // Restore manage modal if it was open before
                        if (manageModalWasOpen) {
                            setShowManageModal(true);
                            setManageModalWasOpen(false);
                        }
                    }}
                />
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

const ScheduleDetail = ({ icon, label, value }) => (
    <div className="p-3 bg-slate-50/50 rounded-2xl border border-white">
        <div className="flex items-center space-x-2 text-slate-400 mb-1">
            {icon}
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-xs font-black text-slate-900">{value}</p>
    </div>
);
