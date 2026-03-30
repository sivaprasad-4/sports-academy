import { useEffect, useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { performanceService, academyService, reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, Cell, ResponsiveContainer, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
    TrendingUp, Award, Save, Plus, User, Calendar, Activity,
    RefreshCw, ChevronUp, ChevronDown, Minus, Medal, Search, 
    ArrowRight, Info, Table, BarChart2, PieChart as PieChartIcon, 
    Zap, Target, Clock, Filter, CheckCircle2, FileText, Printer, Database, Trophy
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatValue = (val, metricName) => {
    if (val === null || val === undefined) return '—';
    if (metricName?.toLowerCase().includes('beep')) {
        const v = parseFloat(val);
        const level = Math.floor(v);
        const shuttle = Math.round((v % 1) * 100);
        return `${level}.${shuttle}`;
    }
    return parseFloat(val).toFixed(1);
};

const ImprovBadge = ({ v }) => {
    const num = parseFloat(v);
    if (isNaN(num) || num === 0) return <span className="text-xs text-gray-400 flex items-center"><Minus size={12}/>0%</span>;
    if (num > 0) return <span className="text-xs text-green-600 font-bold flex items-center"><ChevronUp size={12}/>{num.toFixed(1)}%</span>;
    if (num < 0) return <span className="text-xs text-red-500 font-bold flex items-center"><ChevronDown size={12}/>{Math.abs(num).toFixed(1)}%</span>;
};

const RankMedal = ({ rank }) => {
    if (rank === 1) return <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20"><Medal className="text-white" size={24}/></div>;
    if (rank === 2) return <div className="w-10 h-10 bg-slate-300 rounded-lg flex items-center justify-center shadow-lg shadow-slate-400/20"><Medal className="text-white" size={24}/></div>;
    if (rank === 3) return <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20"><Medal className="text-white" size={24}/></div>;
    return <div className="w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center font-black text-slate-500 text-sm">#{rank}</div>;
};

const MetricCard = ({ metric, onClick, isActive }) => (
    <div 
        onClick={onClick}
        className={`glass-card p-6 cursor-pointer transition-all duration-500 group relative overflow-hidden ${
            isActive ? 'ring-2 ring-primary-500 shadow-2xl shadow-primary-500/20 bg-white/40' : 'hover:bg-white/30'
        }`}
    >
        {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -mr-16 -mt-16 animate-pulse" />}
        
        <div className="flex justify-between items-start relative z-10">
            <div>
                <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">{metric.metric_name}</h3>
                    <div className="p-1 bg-white/50 backdrop-blur-md rounded-md border border-white/20 group-hover:scale-110 transition-transform">
                        <Target size={12} className="text-slate-400" />
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{metric.athlete_name}</p>
            </div>
            <ImprovBadge v={metric.improvement_percentage} />
        </div>

        <div className="mt-6 flex items-baseline space-x-2 relative z-10">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
                {formatValue(metric.latest_value, metric.metric_name)}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.unit || 'units'}</span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 relative z-10">
            {[
                { label: 'Best', value: formatValue(metric.best_value, metric.metric_name), color: 'text-green-600' },
                { label: 'Avg', value: formatValue(metric.average_value, metric.metric_name), color: 'text-amber-600' },
                { label: 'Hits', value: metric.test_count, color: 'text-slate-600' }
            ].map(s => (
                <div key={s.label} className="bg-white/40 backdrop-blur-sm rounded-xl p-2 border border-white/20">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{s.label}</p>
                    <p className={`text-xs font-black ${s.color}`}>{s.value}</p>
                </div>
            ))}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-4 border-white/40 shadow-2xl backdrop-blur-xl bg-white/60">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-white/20 pb-1">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between space-x-8 mt-1">
                        <span className="text-xs font-bold text-slate-600 flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: p.color }} />
                            {p.name}:
                        </span>
                        <span className="text-sm font-black text-slate-900">{parseFloat(p.value || 0).toFixed(1)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const PerformancePage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics');

    // Analytics state
    const [summary, setSummary] = useState([]);
    const [selectedBatchForAnalytics, setSelectedBatchForAnalytics] = useState('');
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Record data state
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [athletes, setAthletes] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [selectedMetricForRecord, setSelectedMetricForRecord] = useState('');
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [showNewSessionForm, setShowNewSessionForm] = useState(false);
    const [newSessionData, setNewSessionData] = useState({ name: '', date: new Date().toISOString().split('T')[0] });
    const [performanceData, setPerformanceData] = useState({});
    const [notesData, setNotesData] = useState({});
    const [recordSummary, setRecordSummary] = useState([]);
    const [sessionResults, setSessionResults] = useState([]); // Store all results for current session/metric
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Rankings state
    const [rankings, setRankings] = useState([]);
    const [rankingBatch, setRankingBatch] = useState('');
    const [rankingsLoading, setRankingsLoading] = useState(false);

    // Batch comparison state
    const [comparison, setComparison] = useState([]);
    const [compAthlete, setCompAthlete] = useState('');
    const [compLoading, setCompLoading] = useState(false);
    const [batchAthletes, setBatchAthletes] = useState([]);

    // Admin metrics management state
    const [adminSportId, setAdminSportId] = useState('');
    const [sports, setSports] = useState([]);
    const [adminMetrics, setAdminMetrics] = useState([]);
    const [newMetricForm, setNewMetricForm] = useState({
        name: '', unit: '', metric_type: 'OTHER', higher_is_better: true, weight_percentage: 100, description: ''
    });
    const [showMetricForm, setShowMetricForm] = useState(false);

    // Reports state
    const [reportBatch, setReportBatch] = useState('');
    const [reportAthlete, setReportAthlete] = useState('');
    const [reportAthletes, setReportAthletes] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        loadPerformanceData();
        loadBatches();
        loadSessions();
        if (user.role === 'ADMIN' || user.role === 'COACH') loadSports();
    }, [selectedBatchForAnalytics]);

    useEffect(() => {
        if (selectedBatch) {
            const batch = batches.find(b => String(b.id) === String(selectedBatch));
            if (batch) { 
                loadAthletes(batch.id); 
                loadMetrics(batch.sport); 
                // Reset session if it no longer matches the batch sport
                setSelectedSession('');
                // Fetch context summary for the recording tab
                performanceService.getSummary(null, batch.id).then(setRecordSummary).catch(console.error);
            }
        } else { setAthletes([]); setMetrics([]); setRecordSummary([]); setSelectedSession(''); setSelectedMetricForRecord(''); }
    }, [selectedBatch, batches]);

    useEffect(() => {
        if (selectedSession && selectedMetricForRecord && athletes.length > 0) {
            loadExistingResults(selectedSession, selectedMetricForRecord);
        } else { setPerformanceData({}); setNotesData({}); setSessionResults([]); }
    }, [selectedSession, selectedMetricForRecord, athletes]);

    useEffect(() => {
        if (rankingBatch) loadRankings(rankingBatch);
    }, [rankingBatch]);

    useEffect(() => {
        if (adminSportId) loadAdminMetrics(adminSportId);
    }, [adminSportId]);

    const loadPerformanceData = async () => {
        setLoading(true);
        try {
            const athleteId = user.role === 'ATHLETE' ? user.id : null;
            const data = await performanceService.getSummary(athleteId, selectedBatchForAnalytics);
            setSummary(data);
            if (data.length > 0) loadTrends(athleteId || data[0].athlete_id, data[0].metric_id);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadTrends = async (athleteId, metricId) => {
        try {
            const trends = await performanceService.getTrends(athleteId, metricId);
            setTrendData(trends); setSelectedMetric(metricId);
        } catch (e) { console.error(e); }
    };

    const loadBatches = async () => {
        try { setBatches(await academyService.getBatches()); } catch (e) { console.error(e); }
    };

    const loadAthletes = async (batchId) => {
        try { setAthletes(await academyService.getBatchAthletes(batchId)); } catch (e) { console.error(e); }
    };

    const loadMetrics = async (sportId) => {
        try {
            const data = await performanceService.getMetrics(sportId);
            setMetrics(data);
            // Only set default if nothing is selected or if current selection is not in the new metric list
            if (!selectedMetricForRecord || !data.find(m => m.id.toString() === selectedMetricForRecord)) {
                setSelectedMetricForRecord(data.length > 0 ? data[0].id.toString() : '');
            }
        } catch (e) { console.error(e); }
    };

    const loadSessions = async () => {
        try { setSessions(await performanceService.getSessions()); } catch (e) { console.error(e); }
    };

    const loadSports = async () => {
        try { setSports(await academyService.getSports()); } catch (e) { console.error(e); }
    };

    const loadAdminMetrics = async (sportId) => {
        try { setAdminMetrics(await performanceService.getMetrics(sportId)); } catch (e) { console.error(e); }
    };

    const loadExistingResults = async (sessionId, metricId) => {
        try {
            const data = await performanceService.getResults({ session: sessionId, metric: metricId });
            setSessionResults(data);
            // We don't pre-fill performanceData anymore to encourage adding NEW attempts, 
            // but we can clear it to prepare for fresh input
            setPerformanceData({}); setNotesData({});
        } catch (e) { console.error(e); }
    };

    const loadRankings = async (batchId, recalc = false) => {
        setRankingsLoading(true);
        try {
            if (recalc) await performanceService.calculatePerformance({ batch_id: parseInt(batchId) });
            const data = await performanceService.getBatchRanking(batchId);
            setRankings(data);
            // Load athletes for comparison dropdown
            const aths = await academyService.getBatchAthletes(parseInt(batchId));
            setBatchAthletes(aths);
            if (aths.length > 0) setCompAthlete(aths[0].user.id.toString());
        } catch (e) { console.error(e); }
        finally { setRankingsLoading(false); }
    };

    const loadComparison = async () => {
        if (!rankingBatch || !compAthlete) return;
        setCompLoading(true);
        try {
            const data = await performanceService.getBatchComparison(rankingBatch, compAthlete);
            setComparison(data);
        } catch (e) { console.error(e); }
        finally { setCompLoading(false); }
    };

    useEffect(() => {
        if (compAthlete && rankingBatch) loadComparison();
    }, [compAthlete, rankingBatch]);

    const handleCreateSession = async () => {
        if (!newSessionData.name || !selectedBatch) return;
        try {
            const batch = batches.find(b => String(b.id) === String(selectedBatch));
            const data = await performanceService.createSession({ name: newSessionData.name, sport: batch.sport, date: newSessionData.date });
            setSessions([data, ...sessions]);
            setSelectedSession(data.id.toString());
            setShowNewSessionForm(false);
            setNewSessionData({ name: '', date: new Date().toISOString().split('T')[0] });
            setMessage({ type: 'success', text: 'Test session created.' });
        } catch (e) { setMessage({ type: 'error', text: 'Failed to create session.' }); }
    };

    const handleSavePerformance = async () => {
        if (!selectedSession || !selectedMetricForRecord) {
            setMessage({ type: 'error', text: 'Please select a session and metric.' }); return;
        }
        setSaving(true); setMessage({ type: '', text: '' });
        try {
            const resultsToSave = Object.entries(performanceData)
                .filter(([, v]) => v !== '' && v !== undefined)
                .map(([athleteId, value]) => ({
                    athlete_id: parseInt(athleteId),
                    metric_id: parseInt(selectedMetricForRecord),
                    value: parseFloat(value),
                    notes: notesData[athleteId] || ''
                }));
            if (!resultsToSave.length) { setMessage({ type: 'error', text: 'No values to save.' }); setSaving(false); return; }
            await performanceService.bulkCreateResults({ session_id: parseInt(selectedSession), results: resultsToSave });
            setMessage({ type: 'success', text: '✅ Data saved! Performance indices have been recalculated.' });
            loadPerformanceData();
            loadExistingResults(selectedSession, selectedMetricForRecord); // Refresh session history
        } catch (e) { setMessage({ type: 'error', text: 'Failed to save data.' }); }
        finally { setSaving(false); }
    };

    const handleCreateMetric = async (e) => {
        e.preventDefault();
        try {
            await performanceService.createMetric({ ...newMetricForm, sport: parseInt(adminSportId) });
            setShowMetricForm(false);
            setNewMetricForm({ name: '', unit: '', metric_type: 'OTHER', higher_is_better: true, weight_percentage: 100, description: '' });
            loadAdminMetrics(adminSportId);
        } catch (e) { console.error(e); }
    };

    const handleDeleteMetric = async (id) => {
        if (!window.confirm('Delete this metric?')) return;
        try { await performanceService.deleteMetric(id); loadAdminMetrics(adminSportId); } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (reportBatch) {
            academyService.getBatchAthletes(parseInt(reportBatch)).then(setReportAthletes).catch(console.error);
        } else {
            setReportAthletes([]);
            setReportAthlete('');
        }
    }, [reportBatch]);

    const handleGenerateReport = async () => {
        if (!reportAthlete) return;
        setReportLoading(true);
        try {
            const data = await reportService.getPerformanceReport(reportAthlete);
            setReportData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setReportLoading(false);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </Layout>
    );

    const selectedMetricDetails = metrics.find(m => String(m.id) === String(selectedMetricForRecord));
    const tabs = user.role === 'ATHLETE'
        ? [{ key: 'analytics', label: 'Analytics' }]
        : [
            { key: 'analytics', label: '📈 Analytics' },
            { key: 'rankings', label: '🏆 Rankings' },
            { key: 'reports', label: '📑 Reports' },
            ...(user.role === 'COACH' ? [
                { key: 'record', label: '📝 Record Data' },
                { key: 'metrics', label: '⚙️ Manage Metrics' }
            ] : []),
        ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/40">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-2xl shadow-primary-500/30 flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                                <Activity className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                    Performance <span className="text-primary-600">Laboratory</span>
                                </h1>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-slate-400 space-x-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Live Monitoring</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {user.role} Control Panel v2.0
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Lab Stats Bar */}
                        <div className="flex items-center space-x-2 md:space-x-4 bg-slate-900/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                            {[
                                { label: 'Active Metrics', val: metrics.length || adminMetrics.length || '—', icon: Target },
                                { label: 'Sessions', val: sessions.length || '—', icon: Clock }
                            ].map(s => (
                                <div key={s.label} className="flex flex-col items-center px-4 border-r border-slate-200 last:border-0">
                                    <s.icon size={14} className="text-primary-500 mb-1" />
                                    <span className="text-lg font-black text-slate-900 leading-none">{s.val}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-2 p-1 bg-slate-900/5 rounded-2xl w-fit backdrop-blur-sm">
                    {tabs.map((tab) => {
                        const Icon = tab.label.includes('📈') ? TrendingUp : tab.label.includes('🏆') ? Award : tab.label.includes('📝') ? Table : Table;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                    activeTab === tab.key
                                        ? 'bg-white text-primary-600 shadow-md ring-1 ring-slate-900/5'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                            >
                                <span className="relative z-10">{tab.label.replace(/^[^a-zA-Z]+/, '')}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ═══ Analytics Tab ════════════════════════════════════════════════════ */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        {user.role !== 'ATHLETE' && (
                            <div className="glass-card p-6 border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-30">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-primary-50 rounded-xl">
                                        <Filter className="text-primary-600" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Laboratory Filter</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target batch selection</p>
                                    </div>
                                </div>
                                <CustomSelect
                                    placeholder="Full Academy Data"
                                    icon={Filter}
                                    options={[
                                        { value: '', label: 'Full Academy Data' },
                                        ...batches.map(b => ({ value: b.id, label: `${b.name} • ${b.sport_name}` }))
                                    ]}
                                    value={selectedBatchForAnalytics}
                                    onChange={e => setSelectedBatchForAnalytics(e.target.value)}
                                    className="w-full md:w-72"
                                />
                            </div>
                        )}

                        {summary.length === 0 ? (
                            <div className="glass-card py-24 text-center border-dashed border-2 border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Award className="text-slate-200" size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">No Test Results</h3>
                                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
                                    {selectedBatchForAnalytics ? 'Target lab results not yet recorded.' : 'Performance laboratory is empty.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {summary.map((metric, index) => (
                                        <MetricCard 
                                            key={index} 
                                            metric={metric} 
                                            onClick={() => loadTrends(metric.athlete_id, metric.metric_id)}
                                            isActive={selectedMetric === metric.metric_id}
                                        />
                                    ))}
                                </div>

                                {trendData.length > 0 && (
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-400/20 to-indigo-500/20 rounded-3xl blur-xl"></div>
                                        <div className="relative glass-card p-8 border-white/40">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30">
                                                        <TrendingUp className="text-white" size={20} />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Performance Trajectory</h2>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Historical development timeline</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 bg-slate-900/5 px-4 py-2 rounded-xl">
                                                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Metric Flux</span>
                                                </div>
                                            </div>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                                                        <defs>
                                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                                            dy={10}
                                                        />
                                                        <YAxis 
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="value" 
                                                            stroke="#6366f1" 
                                                            strokeWidth={4}
                                                            dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 5 }}
                                                            activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 0, fill: '#6366f1' }}
                                                            animationDuration={1500}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ═══ Rankings Tab ════════════════════════════════════════════════════ */}
                {activeTab === 'rankings' && (
                    <div className="space-y-8">
                        <div className="glass-card p-8 border-white/40 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-30">
                            <div className="max-w-md">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-2">Leaderboard Generator</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                    Calculate competitive standing for the selected batch. Rankings are based on the aggregate performance index.
                                </p>
                            </div>
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    <CustomSelect
                                        placeholder="Select Target Batch..."
                                        icon={Database}
                                        options={batches.map(b => ({ value: b.id, label: `${b.name} • ${b.sport_name}` }))}
                                        value={rankingBatch}
                                        onChange={e => setRankingBatch(e.target.value)}
                                        className="min-w-[240px]"
                                    />
                                    {rankingBatch && (
                                        <button
                                            onClick={() => loadRankings(rankingBatch, true)}
                                            disabled={rankingsLoading}
                                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                                        >
                                            <RefreshCw size={14} className={rankingsLoading ? 'animate-spin' : ''} />
                                            <span>Initialize Recalculation</span>
                                        </button>
                                    )}
                                </div>
                        </div>

                        {rankingBatch && (
                            <div className="space-y-8">
                                {rankingsLoading ? (
                                    <div className="flex justify-center py-24">
                                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : rankings.length > 0 ? (
                                    <>
                                        {/* Ranking Table */}
                                        <div className="glass-card overflow-hidden p-0 border-white/40 shadow-2xl">
                                            <div className="p-8 border-b border-slate-100 bg-white/40 flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Batch Standings</h2>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aggregate performance index</p>
                                                </div>
                                                <div className="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                    Live Rankings
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50">
                                                        <tr>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Standing</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Index Score</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Density</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100/50">
                                                        {rankings.map((r, i) => (
                                                            <tr key={r.athlete_id} className={`group hover:bg-white/60 transition-colors duration-300`}>
                                                                <td className="px-8 py-6">
                                                                    <RankMedal rank={r.rank} />
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                                                                            <User size={18} className="text-slate-400" />
                                                                        </div>
                                                                        <span className="text-sm font-black text-slate-800">{r.athlete_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-baseline space-x-1">
                                                                        <span className={`text-2xl font-black ${parseFloat(r.performance_index) >= 75 ? 'text-green-500' : parseFloat(r.performance_index) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                                            {parseFloat(r.performance_index) > 0 ? parseFloat(r.performance_index).toFixed(1) : '—'}
                                                                        </span>
                                                                        <span className="text-[8px] font-black text-slate-400 tracking-tighter uppercase">/ 100</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="relative w-full max-w-[200px]">
                                                                        <div className="bg-slate-100 rounded-full h-3 border border-white/40 overflow-hidden shadow-inner">
                                                                            <div
                                                                                className="h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                                                style={{
                                                                                    width: `${Math.min(100, r.performance_index)}%`,
                                                                                    background: r.performance_index >= 75 
                                                                                        ? 'linear-gradient(90deg, #10b981, #34d399)' 
                                                                                        : r.performance_index >= 50 
                                                                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                                                                                            : 'linear-gradient(90deg, #ef4444, #f87171)'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="absolute top-full mt-2 left-0 text-[8px] font-bold text-slate-400 tracking-widest uppercase">
                                                                            Accuracy: {Math.max(100 - (i * 2), 85)}%
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Batch Comparison Chart */}
                                        {batchAthletes.length > 0 && (
                                            <div className="glass-card p-8 border-white/40">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Comparative Analysis</h2>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subject vs Batch Median</p>
                                                    </div>
                                                    <CustomSelect
                                                        placeholder="Choose Athlete..."
                                                        icon={User}
                                                        options={batchAthletes.map(a => ({ 
                                                            value: a.user.id, 
                                                            label: `${a.user.first_name} ${a.user.last_name}` 
                                                        }))}
                                                        value={compAthlete}
                                                        onChange={e => setCompAthlete(e.target.value)}
                                                        className="w-full md:w-64"
                                                    />
                                                </div>
                                                {compLoading ? (
                                                    <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>
                                                ) : comparison.length > 0 ? (
                                                    <div className="h-[350px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={comparison} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                                <XAxis dataKey="metric_name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} angle={-25} textAnchor="end" />
                                                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Legend verticalAlign="top" align="right" iconType="circle" />
                                                                <Bar dataKey="athlete_score" name="Subject Index" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                                                                <Bar dataKey="batch_avg_score" name="Academy Baseline" fill="#E2E8F0" radius={[6, 6, 0, 0]} barSize={24} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <div className="py-12 text-center border-dashed border-2 border-slate-100 rounded-3xl">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Telemetry insufficient for comparison</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="glass-card text-center py-20 border-white/40">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Medal size={40} className="text-slate-200" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Baseline Not Established</h3>
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Execute standings recalculation to view results</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Reports Tab ════════════════════════════════════════════════════ */}
                {activeTab === 'reports' && (
                    <div className="space-y-8">
                        <div className="glass-card p-8 border-white/40 shadow-xl print:hidden relative z-30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                <CustomSelect
                                    label="1. Select Batch"
                                    placeholder="Choose a batch..."
                                    icon={Database}
                                    options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.sport_name})` }))}
                                    value={reportBatch}
                                    onChange={e => setReportBatch(e.target.value)}
                                />
                                <CustomSelect
                                    label="2. Target Athlete"
                                    placeholder="Choose an athlete..."
                                    icon={User}
                                    options={reportAthletes.map(a => ({ value: a.user.id, label: `${a.user.first_name} ${a.user.last_name}` }))}
                                    value={reportAthlete}
                                    onChange={e => setReportAthlete(e.target.value)}
                                    disabled={!reportBatch}
                                />
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={!reportAthlete || reportLoading}
                                    className="bg-primary-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                                >
                                    <FileText size={16} className={reportLoading ? 'animate-pulse' : ''} />
                                    <span>{reportLoading ? 'Compiling Dossier...' : 'Generate Report'}</span>
                                </button>
                            </div>
                        </div>

                        {reportData && (
                            <div className="glass-card p-10 border-white/40 bg-white shadow-2xl" id="report-print-area">
                                <style type="text/css">{`
                                    @media print {
                                        /* Hide everything else */
                                        body * { visibility: hidden; }
                                        #report-print-area, #report-print-area * { visibility: visible; }
                                        
                                        /* Reset print area positioning to allow multiple pages */
                                        #report-print-area { 
                                            position: static !important;
                                            width: 100% !important;
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            border: none !important;
                                            box-shadow: none !important;
                                            display: block !important;
                                        }

                                        .print-hidden { display: none !important; }

                                        /* Force charts to have dimensions in print */
                                        .recharts-responsive-container {
                                            height: 350px !important;
                                            width: 100% !important;
                                        }
                                        
                                        .progression-container .recharts-responsive-container {
                                            height: 300px !important;
                                        }

                                        /* Multi-page support */
                                        table { page-break-inside: auto; width: 100% !important; }
                                        tr { page-break-inside: avoid; page-break-after: auto; }
                                        .page-break-before { page-break-before: always; padding-top: 2rem; }

                                        /* Preserve colors */
                                        * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                                        .glass-card { background: white !important; border: 1px solid #e2e8f0 !important; }
                                    }
                                `}</style>
                                <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center">
                                            <User size={40} className="text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{reportData.athlete_name}</h2>
                                            <p className="text-xs text-primary-600 font-bold uppercase tracking-widest">{reportData.batch_name} • ID: {String(reportData.athlete_id).padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-1">Performance Dossier</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generated: {new Date().toLocaleDateString()}</p>
                                        <button onClick={() => window.print()} className="print-hidden mt-4 flex items-center justify-end space-x-2 text-[10px] font-black text-slate-500 hover:text-primary-600 uppercase tracking-widest transition-colors ml-auto">
                                            <Printer size={14} /> <span>Print Dossier</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <Target size={18} className="text-primary-500" />
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rose Chart Analysis</h3>
                                        </div>
                                        <div className="h-[350px] bg-slate-50/50 rounded-3xl border border-slate-100 p-4">
                                            {reportData.metrics.length >= 3 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart data={reportData.metrics.map(m => {
                                                        let score = 0;
                                                        if (m.academy_best) {
                                                            if (m.higher_is_better) {
                                                                const v = (m.best / m.academy_best) * 100;
                                                                score = Math.min(100, isNaN(v) ? 0 : v);
                                                            } else {
                                                                const v = (m.academy_best / (m.best || 1)) * 100;
                                                                score = Math.min(100, isNaN(v) ? 0 : v);
                                                            }
                                                        } else {
                                                            score = 50; 
                                                        }
                                                        return { metric: m.metric_name, score: score };
                                                    })}>
                                                        <PolarGrid stroke="#E2E8F0" />
                                                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 900 }} />
                                                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar name="Athlete Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <Activity className="text-slate-300 mb-2" size={32} />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Need at least 3 metrics for Rose Chart</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <BarChart2 size={18} className="text-primary-500" />
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Metric Ledger</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tl-xl">Metric</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latest</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Best</th>
                                                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tr-xl">Academy Best</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {reportData.metrics.map((m, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-4">
                                                                <p className="text-xs font-black text-slate-800">{m.metric_name}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.test_count} Tests • {m.metric_type}</p>
                                                            </td>
                                                            <td className="px-4 py-4 text-sm font-black text-slate-700">{formatValue(m.latest, m.metric_name)} <span className="text-[9px] text-slate-400 uppercase">{m.metric_unit}</span></td>
                                                            <td className="px-4 py-4 text-sm font-black text-emerald-600">{formatValue(m.best, m.metric_name)} <span className="text-[9px] text-emerald-600/50 uppercase">{m.higher_is_better ? '▲' : '▼'}</span></td>
                                                            <td className="px-4 py-4 text-sm font-black text-slate-400">{formatValue(m.academy_best, m.metric_name)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {reportData.index_history && reportData.index_history.length > 0 && (
                                    <div className="space-y-6 pt-10 border-t border-slate-100 progression-container">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <TrendingUp size={18} className="text-primary-500" />
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Performance Progression</h3>
                                        </div>
                                        <div className="h-[300px] bg-slate-50/50 rounded-3xl border border-slate-100 p-4 shadow-inner">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={reportData.index_history}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} />
                                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="performance_index" 
                                                        name="Performance Index" 
                                                        stroke="#6366f1" 
                                                        strokeWidth={4} 
                                                        dot={{ fill: '#6366f1', r: 4 }} 
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">
                                            Index progression tracks the overall weighted growth across all performance metrics.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Record Data Tab ════════════════════════════════════════════════ */}
                {activeTab === 'record' && (
                    <div className="space-y-8">
                        <div className="glass-card p-8 border-white/40 shadow-xl relative z-30">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <CustomSelect
                                    label="1. Test Batch"
                                    placeholder="Choose a batch..."
                                    icon={Database}
                                    options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.sport_name})` }))}
                                    value={selectedBatch}
                                    onChange={e => setSelectedBatch(e.target.value)}
                                />
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Test Session</label>
                                        {selectedBatch && user.role === 'COACH' && (
                                            <button onClick={() => setShowNewSessionForm(!showNewSessionForm)} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors flex items-center">
                                                {showNewSessionForm ? 'Cancel' : 'New Session'}
                                            </button>
                                        )}
                                    </div>
                                    <CustomSelect
                                        placeholder="Choose a session..."
                                        icon={Clock}
                                        options={sessions
                                            .filter(s => { 
                                                const b = batches.find(b => String(b.id) === String(selectedBatch)); 
                                                return b && String(s.sport) === String(b.sport); 
                                            })
                                            .map(s => ({ value: s.id, label: `${s.name} • ${s.date}` }))
                                        }
                                        value={selectedSession}
                                        onChange={e => setSelectedSession(e.target.value)}
                                        disabled={!selectedBatch}
                                    />
                                    
                                    {showNewSessionForm && (
                                        <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white outline outline-1 outline-slate-200 shadow-2xl space-y-3 absolute z-50 left-0 right-0 top-full mt-2 mx-0 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <input type="text" placeholder="Session Identifier (e.g. Monthly Physical)" value={newSessionData.name}
                                                onChange={e => setNewSessionData({ ...newSessionData, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                                            <input type="date" value={newSessionData.date}
                                                onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                                            <button onClick={handleCreateSession} className="w-full bg-primary-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all">Initialize Lab Session</button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <CustomSelect
                                        label="3. Target Metric"
                                        placeholder={metrics.length === 0 ? "No metrics defined" : "Choose a metric..."}
                                        icon={Target}
                                        options={metrics.map(m => ({ value: m.id, label: m.name }))}
                                        value={selectedMetricForRecord}
                                        onChange={e => setSelectedMetricForRecord(e.target.value)}
                                        disabled={!selectedBatch}
                                    />
                                    {selectedMetricDetails && (
                                        <div className="glass-card p-4 border-slate-100 bg-white/40">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Standard Unit</p>
                                                    <p className="text-xs font-bold text-slate-700">{selectedMetricDetails.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Test Weight</p>
                                                    <p className="text-xs font-bold text-primary-600">{selectedMetricDetails.weight_percentage}%</p>
                                                </div>
                                            </div>
                                            {selectedMetricDetails.description && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/50">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Methodology</p>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{selectedMetricDetails.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>

                        {selectedSession && selectedMetricForRecord && athletes.length > 0 ? (
                            <div className="space-y-4">
                                {message.text && (
                                    <div className={`p-3 rounded-lg border text-sm ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        {message.text}
                                    </div>
                                )}
                                <div className="card overflow-hidden p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Athlete</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Historical Context</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Attempts in Session</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">New Value ({selectedMetricDetails?.unit})</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {athletes.map(athlete => (
                                                    <tr key={athlete.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                                                    <User size={14} className="text-primary-600" />
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {athlete.user.first_name} {athlete.user.last_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {(() => {
                                                                const athleteAttempts = sessionResults.filter(r => String(r.athlete) === String(athlete.user.id));
                                                                const historical = recordSummary.find(s => 
                                                                    String(s.athlete_id) === String(athlete.user.id) && 
                                                                    String(s.metric_id) === String(selectedMetricForRecord)
                                                                );
                                                                
                                                                return (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        {athleteAttempts.length > 0 && (
                                                                            <div className="flex flex-wrap justify-center gap-1">
                                                                                <span className="text-[8px] font-black text-slate-400 uppercase w-full text-center">Session Attempts</span>
                                                                                {athleteAttempts.map((r) => (
                                                                                    <span key={r.id} className="inline-block bg-primary-50 text-primary-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-primary-100" title={r.notes}>
                                                                                        {formatValue(r.value, selectedMetricDetails?.name)}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {historical ? (
                                                                            <div className="flex flex-col items-center">
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Recorded</p>
                                                                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200">
                                                                                    {formatValue(historical.latest_value, selectedMetricDetails?.name)}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            athleteAttempts.length === 0 && <span className="text-xs text-slate-300 italic block text-center">No previous data</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {selectedMetricDetails?.name.toLowerCase().includes('beep') ? (
                                                                <div className="flex items-center gap-1.5 min-w-[140px]">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Lvl"
                                                                            className="input py-1.5 px-2 w-14 text-center text-sm"
                                                                            value={Math.floor(parseFloat(performanceData[athlete.user.id] || 0))}
                                                                            onChange={e => {
                                                                                const shuttle = (parseFloat(performanceData[athlete.user.id] || 0) % 1).toFixed(2);
                                                                                const level = parseInt(e.target.value) || 0;
                                                                                setPerformanceData({ ...performanceData, [athlete.user.id]: (level + parseFloat(shuttle)).toFixed(2) });
                                                                            }} 
                                                                        />
                                                                        <span className="absolute -top-4 left-0 text-[9px] text-gray-400 font-bold uppercase">Level</span>
                                                                    </div>
                                                                    <span className="text-xl font-bold text-gray-300">.</span>
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Sh"
                                                                            className="input py-1.5 px-2 w-14 text-center text-sm"
                                                                            value={Math.round((parseFloat(performanceData[athlete.user.id] || 0) % 1) * 100)}
                                                                            onChange={e => {
                                                                                const level = Math.floor(parseFloat(performanceData[athlete.user.id] || 0));
                                                                                const shuttle = parseInt(e.target.value) || 0;
                                                                                setPerformanceData({ ...performanceData, [athlete.user.id]: (level + (shuttle / 100)).toFixed(2) });
                                                                            }} 
                                                                        />
                                                                        <span className="absolute -top-4 left-0 text-[9px] text-gray-400 font-bold uppercase">Shuttle</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <input type="number" step="any"
                                                                    placeholder={`Enter ${selectedMetricDetails?.unit || 'value'}`}
                                                                    className="input"
                                                                    value={performanceData[athlete.user.id] || ''}
                                                                    onChange={e => setPerformanceData({ ...performanceData, [athlete.user.id]: e.target.value })} />
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input type="text" placeholder="Optional notes..." className="input"
                                                                value={notesData[athlete.user.id] || ''}
                                                                onChange={e => setNotesData({ ...notesData, [athlete.user.id]: e.target.value })} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                                        <button onClick={handleSavePerformance} disabled={saving} className="btn btn-primary flex items-center gap-2">
                                            <Save size={18} />{saving ? 'Saving...' : 'Save Results'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedBatch ? (
                            <div className="card text-center py-10 text-gray-400">
                                <Activity size={40} className="mx-auto mb-3 opacity-30" />
                                <p>Select a Test Session and Metric to begin recording.</p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ═══ Admin – Manage Metrics Tab ═══════════════════════════════════ */}
                {activeTab === 'metrics' && user.role === 'COACH' && (
                    <div className="space-y-6">
                        <div className="card">
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <CustomSelect
                                    label="Select Sport"
                                    placeholder="Choose a sport..."
                                    icon={Activity}
                                    options={sports.map(s => ({ value: s.id, label: s.name }))}
                                    value={adminSportId}
                                    onChange={e => setAdminSportId(e.target.value)}
                                    className="flex-1"
                                />
                                {adminSportId && (
                                    <button onClick={() => setShowMetricForm(!showMetricForm)} className="btn btn-primary flex items-center gap-2">
                                        <Plus size={18} />{showMetricForm ? 'Cancel' : 'Add Metric'}
                                    </button>
                                )}
                            </div>

                            {showMetricForm && adminSportId && (
                                <form onSubmit={handleCreateMetric} className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                    <h3 className="font-bold text-gray-800">New Performance Metric</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label text-sm">Metric Name</label>
                                            <input required className="input py-2" placeholder="e.g., Sprint Speed" value={newMetricForm.name}
                                                onChange={e => setNewMetricForm({ ...newMetricForm, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label text-sm">Unit</label>
                                            <input required className="input py-2" placeholder="e.g., seconds" value={newMetricForm.unit}
                                                onChange={e => setNewMetricForm({ ...newMetricForm, unit: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label text-sm">Type</label>
                                            <select className="input py-2" value={newMetricForm.metric_type}
                                                onChange={e => setNewMetricForm({ ...newMetricForm, metric_type: e.target.value })}>
                                                {['SPEED', 'ENDURANCE', 'STRENGTH', 'SKILL', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label text-sm">Weight % (in overall index)</label>
                                            <input type="number" min="1" max="100" className="input py-2"
                                                value={newMetricForm.weight_percentage}
                                                onChange={e => setNewMetricForm({ ...newMetricForm, weight_percentage: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="label text-sm">Description (Optional)</label>
                                            <textarea className="input py-2 h-20" placeholder="Describe the purpose or methodology of this test..."
                                                value={newMetricForm.description}
                                                onChange={e => setNewMetricForm({ ...newMetricForm, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="label mb-0">Goal:</label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={newMetricForm.higher_is_better}
                                                onChange={() => setNewMetricForm({ ...newMetricForm, higher_is_better: true })} /> Higher is better
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="radio" checked={!newMetricForm.higher_is_better}
                                                onChange={() => setNewMetricForm({ ...newMetricForm, higher_is_better: false })} /> Lower is better
                                        </label>
                                    </div>
                                    <button type="submit" className="btn btn-primary">Create Metric</button>
                                </form>
                            )}
                        </div>

                        {adminSportId && adminMetrics.length > 0 && (
                            <div className="card overflow-hidden p-0">
                                <div className="px-6 py-4 border-b bg-gray-50/50">
                                    <h2 className="font-bold text-gray-900">
                                        {sports.find(s => s.id.toString() === adminSportId)?.name} — Performance Metrics
                                        <span className="ml-2 text-sm font-normal text-gray-400">
                                            (Total weight: {adminMetrics.reduce((s, m) => s + parseFloat(m.weight_percentage), 0).toFixed(0)}%)
                                        </span>
                                    </h2>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Direction</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Weight</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {adminMetrics.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-semibold text-gray-900">{m.name}</td>
                                                <td className="px-6 py-3 text-gray-600">{m.unit}</td>
                                                <td className="px-6 py-3 text-gray-500 text-sm max-w-[200px] truncate" title={m.description}>{m.description || '—'}</td>
                                                <td className="px-6 py-3 text-gray-500 text-sm">{m.metric_type}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${m.higher_is_better ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {m.higher_is_better ? '▲ Higher Better' : '▼ Lower Better'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="font-bold text-primary-600">{m.weight_percentage}%</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button onClick={() => handleDeleteMetric(m.id)}
                                                        className="text-xs text-red-500 hover:text-red-700 font-medium hover:bg-red-50 px-2 py-1 rounded">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {adminSportId && adminMetrics.length === 0 && (
                            <div className="card text-center py-10 text-gray-400 border-dashed">
                                <p>No metrics defined for this sport. Add one above.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};
