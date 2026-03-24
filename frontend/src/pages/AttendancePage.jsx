import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { academyService, reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    CheckCircle, XCircle, Users, Calendar, Clock,
    Save, User, BarChart2, TrendingUp, TrendingDown,
    AlertTriangle, Filter, ChevronRight, Activity,
    Target, Zap, Award, Search, RefreshCw, Info,
    ArrowUpRight, ArrowDownRight, Sun, Moon, Download
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
    Tooltip, Cell, PieChart, Pie
} from 'recharts';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${className}`}>
        {children}
    </div>
);

const AttendanceBadge = ({ status }) => {
    const configs = {
        PRESENT: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={12} /> },
        ABSENT: { color: 'text-rose-600', bg: 'bg-rose-50', icon: <XCircle size={12} /> },
        LATE: { color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={12} /> },
        EXCUSED: { color: 'text-sky-600', bg: 'bg-sky-50', icon: <Info size={12} /> },
    };
    const config = configs[status] || { color: 'text-slate-600', bg: 'bg-slate-50', icon: <Activity size={12} /> };
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${config.bg} ${config.color} border border-white/50 shadow-sm`}>
            {config.icon}
            {status}
        </span>
    );
};

const MetricRing = ({ rate, label, color = "#0ea5e9" }) => {
    const data = [
        { value: rate },
        { value: 100 - rate }
    ];
    
    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={48}
                        paddingAngle={0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                    >
                        <Cell fill={color} stroke="none" />
                        <Cell fill="#f1f5f9" stroke="none" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800 tracking-tighter">{rate}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</span>
            </div>
        </div>
    );
};

// ── Admin: Attendance Pulse ───────────────────────────────────────────────────

const AttendancePulse = ({ summary, onExport, onExportBatch }) => {
    const sortedBatches = useMemo(() => {
        if (!summary?.batches) return [];
        return [...summary.batches].sort((a, b) => b.attendance_rate - a.attendance_rate);
    }, [summary]);

    const best = sortedBatches[0];
    const worst = sortedBatches[sortedBatches.length - 1];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Pulse Header */}
            <div className="flex flex-col lg:flex-row gap-6">
                <GlassCard className="flex-1 border-l-8 border-l-primary-600 flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Academy Vitality</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-slate-900 tracking-tighter">
                                {summary?.overall_attendance_rate || 0}%
                            </span>
                            <span className="text-primary-600 font-bold flex items-center gap-1 text-sm bg-primary-50 px-2 py-1 rounded-lg">
                                <Activity size={14} className="animate-pulse" />
                                LIVE PULSE
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium mt-4 max-w-xs">
                            Aggregate participation across {summary?.total_batches || 0} active training modules.
                        </p>
                    </div>
                    
                    <div className="hidden sm:block opacity-10 absolute -right-4 -bottom-4">
                        <BarChart2 size={160} />
                    </div>
                    
                    <MetricRing rate={summary?.overall_attendance_rate || 0} label="Rate" color="#0369a1" />
                </GlassCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-96">
                    <GlassCard className="flex flex-col justify-center items-center text-center group transition-all hover:bg-emerald-50/50">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <span className="text-2xl font-black text-slate-900 leading-none">{summary?.total_batches || 0}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Batches</p>
                    </GlassCard>
                    <GlassCard className="flex flex-col justify-center items-center text-center group transition-all hover:bg-violet-50/50">
                        <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Calendar size={24} />
                        </div>
                        <span className="text-2xl font-black text-slate-900 leading-none">{summary?.total_sessions || 0}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sessions</p>
                    </GlassCard>
                </div>
            </div>

            {/* Performance Spectrum */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {summary?.top_athlete && (
                    <GlassCard className="flex items-center gap-6 group hover:translate-x-2 transition-transform duration-500 bg-emerald-50/20">
                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <TrendingUp size={32} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Peak Performance Athlete</span>
                                <Award size={10} className="text-emerald-500 animate-bounce" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{summary.top_athlete.athlete_name}</h3>
                            <p className="text-sm text-slate-500 font-medium">Sessions Attended: {summary.top_athlete.present}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-emerald-600 tracking-tighter">{summary.top_athlete.attendance_rate}%</span>
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary.top_athlete.attendance_rate}%` }} />
                            </div>
                        </div>
                    </GlassCard>
                )}

                {summary?.bottom_athlete && (
                    <GlassCard className="flex items-center gap-6 group hover:-translate-x-2 transition-transform duration-500 bg-rose-50/20">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-rose-200">
                            <AlertTriangle size={32} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Support Required</span>
                                <Zap size={10} className="text-rose-500 animate-spin-slow" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{summary.bottom_athlete.athlete_name}</h3>
                            <p className="text-sm text-slate-500 font-medium">Sessions Attended: {summary.bottom_athlete.present}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-rose-600 tracking-tighter">{summary.bottom_athlete.attendance_rate}%</span>
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${summary.bottom_athlete.attendance_rate}%` }} />
                            </div>
                        </div>
                    </GlassCard>
                )}
            </div>

            {/* Batch Inventory Table */}
            <GlassCard className="overflow-hidden p-0 border-white/60">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Batch Participation Audit</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Comprehensive enrollment telemetry</p>
                    </div>
                    {onExport && (
                        <button 
                            onClick={onExport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-primary-600 transition-colors"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-left">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Module / Sport</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Orchestrator</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sessions</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Engagement</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Report</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {(sortedBatches || []).map(b => (
                                <tr key={b.batch_id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-slate-800 tracking-tight">{b.batch_name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{b.sport_name}</div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-600 font-bold">{b.coach_name}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black tracking-tighter">
                                            {b.total_sessions} ENTRIES
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        b.attendance_rate > 80 ? 'bg-emerald-500' : b.attendance_rate > 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`} 
                                                    style={{ width: `${b.attendance_rate}%` }} 
                                                />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 w-10 text-right">{b.attendance_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {onExportBatch && (
                                            <button
                                                onClick={() => onExportBatch(b.batch_id, b.batch_name)}
                                                title={`Download ${b.batch_name} report`}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-50 hover:bg-primary-600 text-primary-600 hover:text-white border border-primary-100 hover:border-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                <Download size={13} /> CSV
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

// ── Coach: Session Control ───────────────────────────────────────────────────

const SessionControl = ({ batches, schedules, athletes, attendanceData, onStatusChange, onBatchSelect, onSave, loading, saving, message }) => {
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');

    useEffect(() => {
        if (batches && batches.length > 0 && !selectedBatch) {
            setSelectedBatch(batches[0].id);
        }
    }, [batches, selectedBatch]);

    useEffect(() => {
        if (selectedBatch) {
            setSelectedSchedule('');
            if (onBatchSelect) onBatchSelect(selectedBatch);
        }
    }, [selectedBatch, onBatchSelect]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Control Console */}
            <GlassCard className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 text-white border-none shadow-2xl shadow-primary-500/10">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] ml-1">Target Module</label>
                    <div className="relative group">
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            <option value="">Initialize Batch Selector...</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.sport_name})</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-500 rotate-90 pointer-events-none" size={18} />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] ml-1">Active Session</label>
                    <div className="relative group">
                        <select
                            value={selectedSchedule}
                            onChange={(e) => setSelectedSchedule(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-30"
                            disabled={!selectedBatch}
                        >
                            <option value="">Target Date/Topic...</option>
                            {(schedules || []).map(s => <option key={s.id} value={s.id}>{s.date} - {s.topic || 'General'}</option>)}
                        </select>
                        <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={18} />
                    </div>
                </div>
            </GlassCard>

            {/* Success/Error Message */}
            {message && message.text && (
                <div 
                    className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest text-[10px] animate-in slide-in-from-top-4 duration-500 shadow-xl ${
                        message.type === 'success' 
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                            : 'bg-rose-500 text-white shadow-rose-500/20'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Attendance Roster */}
            {selectedSchedule ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <div>
                            <span className="text-xl font-black text-slate-800 tracking-tight">Session Roster</span>
                            <span className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                                {athletes.length} REGISTERED
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black">
                                <Activity size={12} className="animate-pulse" /> LIVE SYNC
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(athletes || []).map((athlete) => (
                            <GlassCard 
                                key={athlete.id} 
                                className={`flex items-center justify-between p-4 group transition-all duration-500 ${
                                    athlete.user && attendanceData[athlete.user.id] === 'ABSENT' ? 'bg-rose-50/30' : 'hover:translate-y-[-2px]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                        athlete.user && attendanceData[athlete.user.id] === 'PRESENT' ? 'bg-emerald-100 text-emerald-600 rotate-12' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="text-base font-black text-slate-800 leading-tight">
                                            {athlete.user ? `${athlete.user.first_name} ${athlete.user.last_name}` : 'Unknown Athlete'}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                            {(athlete.user && attendanceData[athlete.user.id] === 'PRESENT') ? 'Active Status' : 'Inactive'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <button
                                        onClick={() => athlete.user && onStatusChange(athlete.user.id, 'PRESENT')}
                                        className={`p-2 rounded-xl transition-all duration-300 shadow-sm ${
                                            athlete.user && attendanceData[athlete.user.id] === 'PRESENT'
                                                ? 'bg-emerald-600 text-white shadow-emerald-200 ring-4 ring-emerald-100'
                                                : 'bg-white text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                                        }`}
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => athlete.user && onStatusChange(athlete.user.id, 'ABSENT')}
                                        className={`p-2 rounded-xl transition-all duration-300 shadow-sm ${
                                            athlete.user && attendanceData[athlete.user.id] === 'ABSENT'
                                                ? 'bg-rose-600 text-white shadow-rose-200 ring-4 ring-rose-100'
                                                : 'bg-white text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                                        }`}
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => onSave(selectedSchedule)}
                            disabled={saving}
                            className="bg-primary-600 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-primary-500/30 hover:bg-primary-500 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {saving ? (
                                <RefreshCw size={22} className="animate-spin" />
                            ) : (
                                <Save size={22} />
                            )}
                            <span>{saving ? 'UPDATING CLOUD...' : 'COMMIT SESSION DATA'}</span>
                        </button>
                    </div>
                </div>
            ) : selectedBatch ? (
                <GlassCard className="text-center py-20 flex flex-col items-center border-dashed border-2">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={40} className="text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">Operational Vacancy</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2 italic">
                        No training sessions have been initialized for this module today. Please check the central scheduler.
                    </p>
                </GlassCard>
            ) : null}
        </div>
    );
};

// ── Athlete: Participation HUD ───────────────────────────────────────────────

const ParticipationHUD = ({ stats, history, onExport }) => {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-700">
            {/* HUD Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <GlassCard className="lg:col-span-5 flex items-center gap-8 bg-slate-900 border-none shadow-[0_20px_50px_rgba(8,112,184,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <MetricRing rate={stats?.attendance_percentage || 0} label="Core Rate" color="#38bdf8" />
                    <div className="flex-1 space-y-4">
                        <div>
                            <h2 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">Telemetry</h2>
                            <p className="text-3xl font-black text-white tracking-tighter">Participation Index</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-slate-800 rounded-xl">
                                <span className="text-white font-black">{stats?.present}</span>
                                <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Attended</span>
                            </div>
                            <div className="px-3 py-1.5 bg-slate-800 rounded-xl">
                                <span className="text-rose-400 font-black">{stats?.absent}</span>
                                <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Missed</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassCard className="flex items-center gap-6 group hover:bg-emerald-50/50 transition-all border-l-4 border-l-emerald-500">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Target size={28} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Integrity</h4>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">Level A-2</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Consistency is key</p>
                        </div>
                    </GlassCard>
                    <GlassCard className="flex items-center gap-6 group hover:bg-amber-50/50 transition-all border-l-4 border-l-amber-500">
                        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center group-hover:-rotate-12 transition-transform">
                            <Award size={28} />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</h4>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">7 Days</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Keep the momentum</p>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Attendance Ledger */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 px-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Session Chronicle</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Registry Log</span>
                    {onExport && (
                        <button 
                            onClick={onExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-primary-600 transition-colors"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(history || []).map((record) => (
                        <GlassCard key={record.id} className="flex items-center justify-between p-5 group hover:border-primary-200 transition-all">
                            <div className="flex items-center gap-5">
                                <div className="text-center group-hover:scale-110 transition-transform">
                                    <div className="text-lg font-black text-slate-900 leading-none">{record.schedule_date ? new Date(record.schedule_date).getDate() : '--'}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.schedule_date ? new Date(record.schedule_date).toLocaleString('default', { month: 'short' }) : '---'}</div>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div>
                                    <div className="text-sm font-black text-slate-800">{record.schedule_topic || 'Standard Protocol'}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5 font-bold">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-xs text-slate-500 tracking-tight">{record.schedule_start_time || '--:--'}</span>
                                    </div>
                                </div>
                            </div>
                            <AttendanceBadge status={record.status} />
                        </GlassCard>
                    ))}
                    {(!history || history.length === 0) && (
                        <div className="col-span-full py-20 text-center">
                            <Activity size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest">Neural connection established. Awaiting training data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Root Page Implementation ──────────────────────────────────────────────────

// Helper: trigger a browser download for a Blob
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};


export const AttendancePage = () => {
    const { user } = useAuth();
    const [batches, setBatches] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [athletes, setAthletes] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    
    // Summary/Analytics State
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [viewMode, setViewMode] = useState('marking'); // For Coach: marking | analytics

    // Auto-dismiss message
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleExportReport = async () => {
        try {
            const blob = await academyService.exportAttendanceCSV();
            downloadBlob(blob, `attendance_all_batches_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            console.error(err);
            alert('Failed to download report: ' + (err?.message || 'Unknown error'));
        }
    };

    const handleExportBatch = async (batchId, batchName) => {
        try {
            const blob = await academyService.exportAttendanceCSV(batchId);
            const safeName = (batchName || 'batch').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            downloadBlob(blob, `attendance_${safeName}_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            console.error(err);
            alert('Failed to download report: ' + (err?.message || 'Unknown error'));
        }
    };

    const handleExportMyAttendance = async () => {
        try {
            const blob = await reportService.exportMyAttendance();
            downloadBlob(blob, `my_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            console.error(err);
            alert('Failed to download report: ' + (err?.message || 'Unknown error'));
        }
    };



    const loadCoreData = useCallback(async () => {
        setLoading(true);
        console.log('[AttendancePage] Initializing telemetry uplink for role:', user?.role);
        try {
            if (user?.role === 'ADMIN') {
                const [batchesRes, summaryRes] = await Promise.all([
                    academyService.getBatches(),
                    academyService.getAttendanceSummary()
                ]);
                setBatches(batchesRes);
                setSummary(summaryRes);
            } else if (user?.role === 'COACH') {
                const [batchesRes, summaryRes] = await Promise.all([
                    academyService.getBatches(),
                    academyService.getAttendanceSummary()
                ]);
                setBatches(batchesRes);
                setSummary(summaryRes);
            } else if (user?.role === 'ATHLETE') {
                const [historyRes, statsRes] = await Promise.all([
                    academyService.getAttendance(),
                    academyService.getAttendanceStats(user.id)
                ]);
                setAthletes(historyRes); 
                setSummary(statsRes);     
            }
            console.log('[AttendancePage] Telemetry uplink stable.');
        } catch (error) {
            console.error('[AttendancePage] Telepathic uplink failed:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        loadCoreData();
    }, [loadCoreData]);

    // Handle Coach selection flow
    const handleBatchSelect = useCallback(async (batchId) => {
        if (!batchId) return;
        try {
            const [schedulesRes, athletesRes] = await Promise.all([
                academyService.getSchedules({ batch: batchId }),
                academyService.getBatchAthletes(batchId)
            ]);
            setSchedules(schedulesRes || []);
            setAthletes(athletesRes || []);
            
            // Default to present
            const defaults = {};
            (athletesRes || []).forEach(a => { 
                if (a.user) defaults[a.user.id] = 'PRESENT'; 
            });
            setAttendanceData(defaults);
            
            // If first schedule exists, load its data
            if (schedulesRes && schedulesRes.length > 0) {
                const existing = await academyService.getAttendance({ schedule: schedulesRes[0].id });
                if (existing && existing.length > 0) {
                    const current = {};
                    existing.forEach(att => { 
                        if (att.athlete) current[att.athlete] = att.status; 
                    });
                    setAttendanceData(prev => ({ ...prev, ...current }));
                }
            }
        } catch (error) {
            console.error('[AttendancePage] Handshake failed:', error);
        }
    }, []);

    const handleCommit = useCallback(async (scheduleId) => {
        if (!scheduleId) return;
        setSaving(true);
        try {
            const attendances = Object.entries(attendanceData).map(([id, status]) => ({
                athlete_id: parseInt(id),
                status
            }));
            await academyService.bulkMarkAttendance({ schedule_id: scheduleId, attendances });
            setMessage({ type: 'success', text: 'Attendance marked successfully!' });
            console.log('[AttendancePage] Telemetry uploaded successfully');
        } catch (error) {
            console.error('[AttendancePage] Uplink error:', error);
            setMessage({ type: 'error', text: 'Failed to mark attendance. Please try again.' });
        } finally {
            setSaving(false);
        }
    }, [attendanceData]);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin shadow-2xl shadow-primary-500/10"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Telemetry...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Global Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black tracking-widest rounded-full shadow-lg shadow-primary-500/30">MODULE v2.4</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Protocol</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">
                            {user.role === 'ADMIN' ? 'Attendance Control' : user.role === 'COACH' ? 'Mission Control' : 'My Trajectory'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            {user.role === 'ADMIN' ? 'Strategic oversight of academy participation cycles.' : 
                             user.role === 'COACH' ? 'Execute training attendance and review batch analytics.' : 
                             'Your personal performance and participation records.'}
                        </p>
                    </div>

                    {user.role === 'COACH' && (
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                            <button
                                onClick={() => setViewMode('marking')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'marking' ? 'bg-white shadow-xl text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                MARKING CONSOLE
                            </button>
                            <button
                                onClick={() => setViewMode('analytics')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'analytics' ? 'bg-white shadow-xl text-primary-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                ANALYTICS HUB
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {user.role === 'ADMIN' && <AttendancePulse summary={summary} onExport={handleExportReport} onExportBatch={handleExportBatch} />}
                
                {user.role === 'COACH' && (
                    viewMode === 'marking' ? (
                        <SessionControl 
                            batches={batches}
                            schedules={schedules}
                            athletes={athletes}
                            attendanceData={attendanceData}
                            onStatusChange={(id, status) => setAttendanceData(prev => ({ ...prev, [id]: status }))}
                            onBatchSelect={handleBatchSelect}
                            onSave={handleCommit}
                            saving={saving}
                            message={message}
                        />
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <AttendancePulse summary={summary} onExport={handleExportReport} onExportBatch={handleExportBatch} />
                        </div>
                    )
                )}

                {user.role === 'ATHLETE' && <ParticipationHUD stats={summary} history={athletes} onExport={handleExportMyAttendance} />}
            </div>
        </Layout>
    );
};
