import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    CreditCard, Plus, Users, TrendingUp, Download, 
    Calendar, Filter, FileText, CheckCircle, AlertCircle, Trash2, Edit,
    Search, ChevronRight, Zap, ShieldCheck, RefreshCw, BarChart2,
    ArrowUpRight, ArrowDownRight, Activity, Award, Clock
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
    AreaChart, Area
} from 'recharts';
import { academyService, paymentService } from '../services';
import { ReceiptModal } from '../components/ReceiptModal';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }) => (
    <div className={`backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${className.includes('bg-') ? className : `bg-white/90 ${className}`}`}>
        {children}
    </div>
);

const CommandTab = ({ active, label, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
            active 
            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-y-[-2px]' 
            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
        }`}
    >
        <Icon size={14} />
        {label}
    </button>
);

const MetricGlow = ({ label, value, icon: Icon, colorClass, subtext }) => (
    <GlassCard className={`flex flex-col gap-4 border-b-4 ${colorClass}`}>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100`}>
                <Icon size={18} className="text-slate-900" />
            </div>
        </div>
        <div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">{subtext}</div>
        </div>
    </GlassCard>
);

export const AdminFeesPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [structures, setStructures] = useState([]);
    const [payments, setPayments] = useState([]);
    const [athleteFees, setAthleteFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [editingStructureId, setEditingStructureId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Form states
    const [newStructure, setNewStructure] = useState({
        sport: '',
        batch: '',
        amount: '',
        payment_type: 'MONTHLY',
        description: ''
    });

    const [assignment, setAssignment] = useState({
        batch_id: '',
        fee_structure_id: '',
        due_date: ''
    });

    const [sports, setSports] = useState([]);
    const [batches, setBatches] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        console.log('[AdminFeesPage] Syncing financial telemetry...');
        try {
            const [statsData, structuresData, historyData, sportsData, batchesData, feesData] = await Promise.all([
                paymentService.getPaymentStats(),
                academyService.getFeeStructures(),
                paymentService.getPaymentHistory(),
                academyService.getSports(),
                academyService.getBatches(),
                academyService.getFees()
            ]);
            setStats(statsData);
            setStructures(structuresData);
            setPayments(historyData);
            setSports(sportsData);
            setBatches(batchesData);
            setAthleteFees(feesData);
            console.log('[AdminFeesPage] Handshake stable. Financial Command Online.');
        } catch (error) {
            console.error('[AdminFeesPage] Telemetry sync failure:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveStructure = async (e) => {
        e.preventDefault();
        try {
            if (editingStructureId) {
                await academyService.updateFeeStructure(editingStructureId, newStructure);
            } else {
                await academyService.createFeeStructure(newStructure);
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error('Error saving fee structure');
        }
    };

    const openEditModal = (structure) => {
        setNewStructure({
            sport: structure.sport || '',
            batch: structure.batch || '',
            amount: structure.amount || '',
            payment_type: structure.payment_type || 'MONTHLY',
            description: structure.description || ''
        });
        setEditingStructureId(structure.id);
        setIsStructureModalOpen(true);
    };

    const confirmDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await academyService.deleteFeeStructure(deleteConfirmId);
            setDeleteConfirmId(null);
            fetchData();
        } catch (error) {
            console.error("Delete Error:", error);
            setDeleteConfirmId(null);
        }
    };

    const handleCloseModal = () => {
        setIsStructureModalOpen(false);
        setEditingStructureId(null);
        setNewStructure({ sport: '', batch: '', amount: '', payment_type: 'MONTHLY', description: '' });
    };

    const handleAssignFees = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        console.log('[AdminFeesPage] Initializing bulk revenue assignment...');
        try {
            const response = await academyService.assignFeesToBatch(assignment);
            setIsAssignModalOpen(false);
            setAssignment({ batch_id: '', fee_structure_id: '', due_date: '' });
            setMessage({ type: 'success', text: response.message || '✅ SUCCESS: Batch revenue protocol initialized.' });
            fetchData();
        } catch (error) {
            console.error('[AdminFeesPage] Assignment failure:', error);
            const errorMsg = error.response?.data?.error || '❌ PROTOCOL FAILURE: Could not sync with treasury.';
            setMessage({ type: 'error', text: errorMsg });
        }
    };

    const handleExport = async (type = 'transactions') => {
        try {
            const blob = await paymentService.exportPaymentHistory(type);
            const fileNameMap = {
                'transactions': 'Payment_History',
                'athlete_summary': 'Athlete_Financial_Summary',
                'monthly_summary': 'Monthly_Revenue_Report'
            };
            const fileName = fileNameMap[type] || 'Financial_Report';
            
            const url = window.URL.createObjectURL(new File([blob], `${fileName}.csv`));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setIsReportMenuOpen(false);
        } catch (error) {
            console.error('Error exporting report');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Initializing Financial Command...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black tracking-widest rounded-full shadow-lg">TREASURY v2.4</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative HUD</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">Financial Command</h1>
                    <p className="text-slate-500 font-medium italic">Liquidity oversight and revenue orchestration across the academy ecosystem.</p>
                </div>
                
                <div className="flex items-center gap-3 relative">
                    <div className="relative group">
                        <button 
                            onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-[10px] tracking-[0.1em] uppercase hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download size={14} /> Report Matrix
                        </button>
                        
                        {isReportMenuOpen && (
                            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
                                {[
                                    { type: 'transactions', label: 'Transaction Flux Logs', icon: FileText },
                                    { type: 'athlete_summary', label: 'Athlete Equity Summary', icon: Users },
                                    { type: 'monthly_summary', label: 'Monthly Liquidity Report', icon: TrendingUp }
                                ].map((item) => (
                                    <button 
                                        key={item.type}
                                        onClick={() => handleExport(item.type)}
                                        className="w-full text-left px-5 py-3 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-3 transition-colors"
                                    >
                                        <item.icon size={16} className="text-slate-400" /> {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => {
                            setEditingStructureId(null);
                            setNewStructure({ sport: '', batch: '', amount: '', payment_type: 'MONTHLY', description: '' });
                            setIsStructureModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                    >
                        <Plus size={16} /> New Plan Forge
                    </button>
                </div>
            </div>

            {/* High-Impact Telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricGlow 
                    label="Academy Revenue" 
                    value={`₹${stats?.total_revenue?.toLocaleString()}`}
                    icon={TrendingUp}
                    colorClass="border-b-emerald-500"
                    subtext="Aggregate settled capital"
                />
                <MetricGlow 
                    label="Active Dues" 
                    value={`₹${stats?.total_pending?.toLocaleString()}`}
                    icon={AlertCircle}
                    colorClass="border-b-amber-500"
                    subtext="Unsettled receivables"
                />
                <MetricGlow 
                    label="Equity Coverage" 
                    value={`${stats?.fully_paid_athletes}`}
                    icon={Award}
                    colorClass="border-b-indigo-500"
                    subtext={`Of ${stats?.total_athletes} active entities`}
                />
                <MetricGlow 
                    label="Active Plans" 
                    value={structures?.length}
                    icon={Zap}
                    colorClass="border-b-purple-500"
                    subtext="Yield structures deployed"
                />
            </div>

            {/* Navigation Tabs */}
            <GlassCard className="p-2 border-none bg-slate-100/50">
                <div className="flex flex-wrap gap-2">
                    <CommandTab active={activeTab === 'dashboard'} label="Control Center" icon={BarChart2} onClick={() => setActiveTab('dashboard')} />
                    <CommandTab active={activeTab === 'structures'} label="Plan Forge" icon={Zap} onClick={() => setActiveTab('structures')} />
                    <CommandTab active={activeTab === 'athlete fees'} label="Equity Roster" icon={Users} onClick={() => setActiveTab('athlete fees')} />
                    <CommandTab active={activeTab === 'transactions'} label="Audit Ledger" icon={FileText} onClick={() => setActiveTab('transactions')} />
                </div>
            </GlassCard>

            {/* Tab Modules */}
            <div className="space-y-10">
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-4 duration-700">
                        <GlassCard className="p-8">
                            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                                        <TrendingUp size={20} />
                                    </div>
                                    Revenue Velocity
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last 6 Iterations</span>
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.revenue_trends}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="total" 
                                            stroke="#4f46e5" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorRev)"
                                            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 bg-slate-900 border-none shadow-2xl shadow-indigo-500/20 text-white">
                            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                                    <Zap size={20} />
                                </div>
                                Bulk Revenue Initiation
                                <span className="ml-auto text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] border border-indigo-400/30 px-2 py-0.5 rounded-full">Automated Pipeline</span>
                            </h3>

                            {message.text && (
                                <div className={`p-4 rounded-2xl flex items-center justify-between border-2 bg-white/5 backdrop-blur-md mb-6 animate-in slide-in-from-right-4 duration-500 ${
                                    message.type === 'success' ? 'border-emerald-500/20 text-emerald-400' : 'border-rose-500/20 text-rose-400'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {message.type === 'success' ? <ShieldCheck size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />}
                                        <p className="text-[10px] font-black tracking-tight uppercase leading-tight">{message.text}</p>
                                    </div>
                                    <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                        <RefreshCw size={12} className="text-white/40" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleAssignFees} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-200 uppercase tracking-widest ml-1">Target Cluster (Batch)</label>
                                        <select 
                                            className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                            value={assignment.batch_id}
                                            onChange={(e) => setAssignment({...assignment, batch_id: e.target.value})}
                                            required
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">Select Cluster...</option>
                                            {batches.map(b => <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name} ({b.sport_name})</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-200 uppercase tracking-widest ml-1">Assigned Protocol (Plan)</label>
                                        <select 
                                            className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                                            value={assignment.fee_structure_id}
                                            onChange={(e) => setAssignment({...assignment, fee_structure_id: e.target.value})}
                                            required
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">Select Protocol...</option>
                                            {structures.map(s => <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.sport_name} - ₹{s.amount}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-200 uppercase tracking-widest ml-1">Submission Deadline (Due Date)</label>
                                    <input 
                                        type="date" 
                                        className="w-full h-12 px-4 bg-slate-800/80 border border-white/20 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                                        value={assignment.due_date}
                                        onChange={(e) => setAssignment({...assignment, due_date: e.target.value})}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3">
                                    <Zap size={18} /> INITIALIZE BATCH ASSIGNMENT
                                </button>
                                <p className="text-[10px] text-slate-500 font-bold text-center leading-relaxed italic">
                                    Initializing this process will broad-scale broadcast financial structures to all entities in the selected cluster.
                                </p>
                            </form>
                        </GlassCard>
                    </div>
                )}

                {activeTab === 'structures' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                        {structures.map((s) => (
                            <GlassCard key={s.id} className="group hover:translate-y-[-4px] transition-all relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"><Edit size={16} /></button>
                                        <button onClick={() => confirmDelete(s.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic shadow-lg">
                                        {s.sport_name?.[0]}{s.sport_name?.[1]}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none">{s.sport_name}</h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.batch_name || 'Global Discipline'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Yield</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tighter">₹{parseFloat(s.amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Flux</span>
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                                            {s.payment_type}
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {(activeTab === 'athlete fees' || activeTab === 'transactions') && (
                    <GlassCard className="p-0 overflow-hidden border-white/60 animate-in slide-in-from-bottom-4 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        {activeTab === 'athlete fees' ? (
                                            <>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity (Athlete)</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Allocation</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settled</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outstanding</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Deadline</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origin (Athlete)</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmission Date</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clearance Amount</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gateway ID & Action</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50 bg-white">
                                    {(activeTab === 'athlete fees' ? athleteFees || [] : payments || []).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            {activeTab === 'athlete fees' ? (
                                                <>
                                                    <td className="px-8 py-5">
                                                        <div className="font-black text-slate-800 tracking-tight truncate max-w-[180px]">{item.athlete_name}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.fee_structure_data?.sport_name}</div>
                                                    </td>
                                                    <td className="px-8 py-5 font-black text-slate-900 tracking-tighter">₹{parseFloat(item.amount || 0).toLocaleString()}</td>
                                                    <td className="px-8 py-5 font-bold text-emerald-600">₹{parseFloat(item.paid_amount || 0).toLocaleString()}</td>
                                                    <td className="px-8 py-5 font-bold text-rose-600">₹{parseFloat(item.balance || 0).toLocaleString()}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            item.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                            'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-8 py-5 font-black text-slate-800 tracking-tight">{item.athlete_name}</td>
                                                    <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.payment_date ? new Date(item.payment_date).toLocaleDateString() : 'N/A'}</td>
                                                    <td className="px-8 py-5 font-black text-slate-900 tracking-tighter">₹{parseFloat(item.amount || 0).toLocaleString()}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            item.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' :
                                                            item.status === 'FAILED' ? 'bg-rose-50 text-rose-700' :
                                                            'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="text-[10px] font-mono text-slate-300 group-hover:text-slate-500 transition-colors uppercase tracking-widest">{item.razorpay_order_id}</div>
                                                            {item.status === 'SUCCESS' && (
                                                                <button 
                                                                    onClick={() => {
                                                                        setSelectedReceipt(item.payment_id);
                                                                        setIsReceiptModalOpen(true);
                                                                    }}
                                                                    className="p-2 bg-slate-50 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                                                                    title="View Receipt"
                                                                >
                                                                    <FileText size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                )}
            </div>

            {/* Modal for New Structure */}
            {isStructureModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <GlassCard className="max-w-md w-full p-8 bg-white shadow-2xl animate-in zoom-in-95 duration-300 border-none">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingStructureId ? 'Edit Yield Plan' : 'Forge New Plan'}</h2>
                            <button type="button" onClick={handleCloseModal} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all text-xl">×</button>
                        </div>
                        <form onSubmit={handleSaveStructure} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Discipline (Sport)</label>
                                <select 
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newStructure.sport}
                                    onChange={(e) => setNewStructure({...newStructure, sport: e.target.value})}
                                    required
                                >
                                    <option value="">Select Discipline...</option>
                                    {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Cluster (Batch)</label>
                                <select 
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newStructure.batch}
                                    onChange={(e) => setNewStructure({...newStructure, batch: e.target.value})}
                                >
                                    <option value="">Global (All Clusters)</option>
                                    {batches.filter(b => !newStructure.sport || b.sport == newStructure.sport).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Yield (Amount ₹)</label>
                                <input 
                                    type="number" 
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newStructure.amount}
                                    onChange={(e) => setNewStructure({...newStructure, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Sequence (Cycle)</label>
                                <select 
                                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newStructure.payment_type}
                                    onChange={(e) => setNewStructure({...newStructure, payment_type: e.target.value})}
                                    required
                                >
                                    <option value="MONTHLY">Monthly Transmissions</option>
                                    <option value="QUARTERLY">Quarterly Cycles</option>
                                    <option value="YEARLY">Annual Reconciliation</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="flex-1 h-12 text-[10px] font-black tracking-widest uppercase text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Abort</button>
                                <button type="submit" className="flex-1 h-12 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Deploy Plan</button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Modal for Delete Confirmation */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
                    <GlassCard className="max-w-sm w-full p-8 bg-white border-none shadow-2xl animate-in zoom-in-95 duration-300 text-center">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-3">Terminate Plan?</h2>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
                            This action will permanently purge the selected financial structure from the active database.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDeleteConfirmId(null)} 
                                className="flex-1 py-3 text-[10px] font-black tracking-widest uppercase text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDelete} 
                                className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-rose-700 shadow-xl shadow-rose-100"
                            >
                                Terminate
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            <ReceiptModal 
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                paymentId={selectedReceipt}
            />
        </div>
    );
};

export default AdminFeesPage;
