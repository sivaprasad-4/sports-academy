import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    Activity, Target, TrendingUp, Award, User, Printer, RefreshCw, MessageSquare, Star
} from 'lucide-react';
import {
    ResponsiveContainer, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const formatValue = (val, metricName) => {
    if (val === null || val === undefined) return '—';
    const name = (metricName || '').toLowerCase();
    if (name.includes('score') || name.includes('index')) return parseFloat(val).toFixed(1);
    return val;
};

export const MyPerformancePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [error, setError] = useState(null);

    const loadReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const [data, fb] = await Promise.all([
                reportService.getPerformanceReport(user.id),
                reportService.getFeedback().catch(() => [])
            ]);
            setReportData(data);
            // Handle paginated or plain array responses
            const fbList = Array.isArray(fb) ? fb : (fb?.results || []);
            setFeedback(fbList);
        } catch (err) {
            console.error('Failed to load performance report:', err);
            setError('Could not load your performance report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const radarChartData = (reportData?.metrics || []).map(m => {
        let score = 50;
        if (m.academy_best) {
            const v = m.higher_is_better
                ? (m.best / m.academy_best) * 100
                : (m.academy_best / (m.best || 1)) * 100;
            score = Math.min(100, isNaN(v) ? 0 : v);
        }
        return { metric: m.metric_name, score };
    });

    return (
        <Layout>
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
                    <div className="relative glass-card p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/40">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-primary-500/20 rounded-2xl blur-lg animate-pulse" />
                                <div className="relative w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                                    <Activity className="text-primary-400" size={40} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">
                                    My <span className="text-primary-600">Performance</span>
                                </h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                    Bio-ID-{String(user.id).padStart(4, '0')} • Personal Dossier
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={loadReport}
                            className="flex items-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card p-24 text-center border-dashed border-2 border-slate-200">
                        <Activity size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-3">Report Unavailable</h3>
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">{error}</p>
                    </div>
                ) : !reportData || !(reportData.metrics || []).length ? (
                    <div className="glass-card p-24 text-center border-dashed border-2 border-slate-200">
                        <Activity size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-3">No Data Yet</h3>
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Awaiting inaugural performance calibration from coaching staff.</p>
                    </div>
                ) : (
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

                        {/* Dossier Header */}
                        <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-8">
                            <div className="flex items-center space-x-6">
                                <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center">
                                    <User size={40} className="text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                        {reportData.athlete_name}
                                    </h2>
                                    <p className="text-xs text-primary-600 font-bold uppercase tracking-widest">
                                        {reportData.batch_name} • ID: {String(reportData.athlete_id).padStart(4, '0')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-1">Performance Dossier</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    Generated: {new Date().toLocaleDateString()}
                                </p>
                                <button
                                    onClick={() => window.print()}
                                    className="print-hidden mt-4 flex items-center justify-end space-x-2 text-[10px] font-black text-slate-500 hover:text-primary-600 uppercase tracking-widest transition-colors ml-auto"
                                >
                                    <Printer size={14} />
                                    <span>Print Dossier</span>
                                </button>
                            </div>
                        </div>

                        {/* Rose Chart + Metric Ledger */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                            {/* Rose Chart */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Target size={18} className="text-primary-500" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Rose Chart Analysis</h3>
                                </div>
                                <div className="h-[350px] bg-slate-50/50 rounded-3xl border border-slate-100 p-4 chart-container">
                                    {radarChartData.length >= 3 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarChartData}>
                                                <PolarGrid stroke="#E2E8F0" />
                                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 900 }} />
                                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Athlete Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }}
                                                    itemStyle={{ color: '#fff', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                                                />
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

                            {/* Metric Ledger */}
                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                    <Award size={18} className="text-primary-500" />
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
                                            {(reportData.metrics || []).map((m, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-black text-slate-800">{m.metric_name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {m.test_count} Tests • {m.metric_type}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-black text-slate-700">
                                                        {formatValue(m.latest, m.metric_name)}{' '}
                                                        <span className="text-[9px] text-slate-400 uppercase">{m.metric_unit}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-black text-emerald-600">
                                                        {formatValue(m.best, m.metric_name)}{' '}
                                                        <span className="text-[9px] text-emerald-600/50 uppercase">{m.higher_is_better ? '▲' : '▼'}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-black text-slate-400">
                                                        {formatValue(m.academy_best, m.metric_name)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Performance Progression – always visible */}
                        <div className="space-y-6 pt-10 border-t border-slate-100 progression-container">
                            <div className="flex items-center space-x-3 mb-6">
                                <TrendingUp size={18} className="text-primary-500" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Performance Progression</h3>
                            </div>
                            <div className="h-[300px] bg-slate-50/50 rounded-3xl border border-slate-100 p-4 shadow-inner">
                                {(reportData.index_history || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={reportData.index_history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} />
                                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: 'none', color: '#fff' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase' }}
                                                itemStyle={{ color: '#fff', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                                            />
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
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <TrendingUp className="text-slate-200 mb-3" size={40} />
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">No progression data yet — complete more test sessions to see your index history.</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">
                                Index progression tracks the overall weighted growth across all performance metrics.
                            </p>
                        </div>

                        {/* ── Coach Analysis (Now inside printable area) ── */}
                        <div className="pt-12 border-t border-slate-100 space-y-6 page-break-before">
                            <div className="flex items-center space-x-3">
                                <MessageSquare size={18} className="text-primary-500" />
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Coach Analysis</h2>
                                {feedback.length > 0 && (
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {feedback.length} briefing{feedback.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {feedback.length === 0 ? (
                                <div className="py-10 text-center border-dashed border-2 border-slate-100 rounded-3xl">
                                    <MessageSquare size={32} className="mx-auto text-slate-200 mb-4" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No Briefings Yet</h3>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {feedback.map((fb, i) => (
                                        <div key={i} className="glass-card p-6 border-slate-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg ${
                                                    fb.is_training_instruction ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                                        {fb.is_training_instruction ? 'Training Protocol' : 'Tactical Analysis'}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(fb.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-sm italic pl-4 border-l-2 border-slate-200">
                                                "{fb.content}"
                                            </p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-3">
                                                Coach: {fb.coach_name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Live-only Feedback View (for better on-screen UX) */}
                {!loading && feedback.length > 0 && (
                    <div className="print-hidden glass-card p-10 border-white/40 space-y-6">
                        <div className="flex items-center space-x-3">
                            <MessageSquare size={18} className="text-primary-500" />
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Coach Briefings</h2>
                        </div>
                        <div className="space-y-4">
                            {feedback.map((fb, i) => (
                                <div key={i} className="glass-card p-6 border-white/40 bg-white/30">
                                    <p className="text-slate-700 font-medium italic">"{fb.content}"</p>
                                    <div className="flex justify-between mt-4">
                                        <span className="text-[9px] font-black uppercase text-primary-600 tracking-widest">{fb.coach_name}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(fb.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};
