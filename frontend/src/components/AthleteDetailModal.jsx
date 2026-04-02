import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
    X, User, Calendar, BarChart2, TrendingUp, 
    CheckCircle, XCircle, Award, Activity, Send, History 
} from 'lucide-react';
import { 
    ResponsiveContainer, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { academyService, performanceService } from '../services';
import { useAuth } from '../context/AuthContext';

export const AthleteDetailModal = ({ athleteId, isOpen, onClose }) => {
    const { user } = useAuth();
    
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

    const [loading, setLoading] = useState(true);
    const [athlete, setAthlete] = useState(null);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [performanceSummary, setPerformanceSummary] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [trends, setTrends] = useState([]);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [feedbackHistory, setFeedbackHistory] = useState([]);
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isInstruction, setIsInstruction] = useState(false);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        if (isOpen && athleteId) {
            loadAthleteData();
        }
    }, [isOpen, athleteId]);

    const loadAthleteData = async () => {
        setLoading(true);
        try {
            // Fetch specific athlete profile by user ID
            // This avoids pagination issues where the athlete might not be on the first page
            const athleteProfiles = await academyService.getAthletes({ user: athleteId });
            
            // The API returns a list (results or plain array)
            const foundAthlete = Array.isArray(athleteProfiles) 
                ? athleteProfiles[0] 
                : (athleteProfiles.results ? athleteProfiles.results[0] : null);

            if (!foundAthlete) {
                console.error('Athlete profile not found for ID:', athleteId);
                setAthlete(null);
                setLoading(false);
                return;
            }

            setAthlete(foundAthlete);

            // Load various data points
            const [attStats, perfSummary, attHistory] = await Promise.all([
                academyService.getAttendanceStats(athleteId),
                performanceService.getSummary(athleteId),
                academyService.getAttendance({ athlete: athleteId })
            ]);

            setAttendanceStats(attStats);
            setPerformanceSummary(perfSummary);
            setAttendanceHistory(attHistory.length > 0 ? attHistory.slice(0, 10) : []); // Just latest 10
            
            const feedback = await academyService.getAthleteFeedback(athleteId);
            setFeedbackHistory(feedback);

            if (perfSummary.length > 0) {
                const defaultMetric = perfSummary.find(m => m.test_count > 0) || perfSummary[0];
                setSelectedMetric(defaultMetric);
            }
        } catch (error) {
            console.error('Failed to load athlete detail data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const loadTrends = async (aId, mId) => {
        setTrendsLoading(true);
        try {
            const trendData = await performanceService.getTrends(aId, mId);
            setTrends(trendData);
        } catch (error) {
            console.error('Failed to load trends:', error);
        } finally {
            setTrendsLoading(false);
        }
    };

    useEffect(() => {
        if (athleteId && selectedMetric) {
            loadTrends(athleteId, selectedMetric.metric_id);
        }
    }, [selectedMetric]);

    const handleSendFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackContent.trim()) return;

        setSubmittingFeedback(true);
        try {
            await academyService.createAthleteFeedback({
                athlete: athleteId,
                content: feedbackContent,
                is_training_instruction: isInstruction
            });
            setFeedbackContent('');
            setIsInstruction(false);
            
            // Reload feedback history
            const feedback = await academyService.getAthleteFeedback(athleteId);
            setFeedbackHistory(feedback);
        } catch (error) {
            console.error('Failed to send feedback:', error);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (!isOpen) return null;

    const statusBadge = (status) => {
        switch (status) {
            case 'PRESENT':
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Present</span>;
            case 'ABSENT':
                return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Absent</span>;
            case 'EXCUSED':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Excused</span>;
            default:
                return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="text-primary-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {athlete ? `${athlete.user.first_name} ${athlete.user.last_name}` : 'Athlete Profile'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {athlete ? `${athlete.sport_name} • ${athlete.batch_name}` : 'Loading details...'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                        <p className="text-gray-500">Retrieving athlete records...</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="card bg-blue-50 border-blue-100">
                                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                                    <Activity size={18} />
                                    <span className="text-sm font-semibold uppercase tracking-wider">Attendance Rate</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{attendanceStats?.attendance_percentage || 0}%</div>
                            </div>
                            <div className="card bg-green-50 border-green-100">
                                <div className="flex items-center space-x-2 text-green-600 mb-2">
                                    <CheckCircle size={18} />
                                    <span className="text-sm font-semibold uppercase tracking-wider">Sessions Present</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{attendanceStats?.present || 0}</div>
                            </div>
                            <div className="card bg-orange-50 border-orange-100">
                                <div className="flex items-center space-x-2 text-orange-600 mb-2">
                                    <Award size={18} />
                                    <span className="text-sm font-semibold uppercase tracking-wider">Tests Taken</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{performanceSummary.length}</div>
                            </div>
                            <div className="card bg-purple-50 border-purple-100">
                                <div className="flex items-center space-x-2 text-purple-600 mb-2">
                                    <TrendingUp size={18} />
                                    <span className="text-sm font-semibold uppercase tracking-wider">Avg Improvement</span>
                                </div>
                                <div className="text-3xl font-bold text-gray-900">
                                    {performanceSummary.length > 0 
                                        ? `${(performanceSummary.reduce((acc, curr) => acc + curr.improvement_percentage, 0) / performanceSummary.length).toFixed(1)}%`
                                        : '0%'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Performance Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Performance List */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                        <BarChart2 className="mr-2 text-primary-600" size={20} />
                                        Performance Metrics
                                    </h3>
                                </div>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {performanceSummary.length === 0 ? (
                                        <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-sm border border-dashed border-gray-200">
                                            No performance data available yet.
                                        </p>
                                    ) : (
                                        performanceSummary.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedMetric(item)}
                                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                                    selectedMetric?.metric_name === item.metric_name
                                                        ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-100 ring-offset-1'
                                                        : 'bg-white border-gray-100 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-semibold text-gray-900">{item.metric_name}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                        item.improvement_percentage >= 0 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.improvement_percentage > 0 ? '+' : ''}{item.improvement_percentage}%
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                    <div>
                                                        <span className="text-gray-500 block">Latest</span>
                                                        <span className="font-medium text-gray-900">{formatValue(item.latest_value, item.metric_name)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Best</span>
                                                        <span className="font-medium text-green-600 font-bold">{formatValue(item.best_value, item.metric_name)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Average</span>
                                                        <span className="font-medium text-gray-700">{formatValue(item.average_value, item.metric_name)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="card h-full flex flex-col min-h-[400px]">
                                    <h3 className="text-lg font-bold text-gray-900 mb-6">
                                        {selectedMetric ? `${selectedMetric.metric_name} Trend` : 'Improvement Over Time'}
                                    </h3>
                                    
                                    <div className="flex-1 min-h-[300px]">
                                        {trendsLoading ? (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                            </div>
                                        ) : trends.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        dy={10}
                                                    />
                                                    <YAxis 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            borderRadius: '12px', 
                                                            border: 'none', 
                                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                                        }}
                                                    />
                                                    <Legend verticalAlign="top" height={36}/>
                                                    <Line 
                                                        name={selectedMetric?.metric_name}
                                                        type="monotone" 
                                                        dataKey="value" 
                                                        stroke="#0ea5e9" 
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                                <TrendingUp size={48} className="mb-2 opacity-20" />
                                                <p>Select a metric to see history</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance History */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <Calendar className="mr-2 text-primary-600" size={20} />
                                Recent Attendance History
                            </h3>
                            <div className="overflow-hidden border border-gray-100 rounded-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Session Topic</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {attendanceHistory.length > 0 ? (
                                            attendanceHistory.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.schedule_date}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                                        {record.schedule_topic || 'Basic Training'}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">
                                                        {record.schedule_start_time} - {record.schedule_end_time}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {statusBadge(record.status)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                                                    No recent attendance records.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Coach Feedback & Instructions */}
                        <div className="pt-8 border-t border-gray-100 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <History className="mr-2 text-primary-600" size={20} />
                                    Coach Feedback & Instructions
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Feedback History */}
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {feedbackHistory.length > 0 ? (
                                        feedbackHistory.map((fb) => (
                                            <div key={fb.id} className={`p-4 rounded-xl border ${fb.is_training_instruction ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${fb.is_training_instruction ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            {fb.is_training_instruction ? 'Instruction' : 'Feedback'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {new Date(fb.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600">By {fb.coach_name}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.content}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                            <History size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No feedback history yet.</p>
                                        </div>
                                    )}
                                </div>

                                {/* New Feedback Form - Only for Coaches/Admins */}
                                {(user?.role === 'COACH' || user?.role === 'ADMIN') && (
                                    <div className="card bg-gray-50 border-gray-200">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                            <Send size={16} className="mr-2 text-primary-600" />
                                            Provide Feedback
                                        </h4>
                                        <form onSubmit={handleSendFeedback} className="space-y-4">
                                            <div>
                                                <textarea
                                                    required
                                                    rows={4}
                                                    className="w-full rounded-xl border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                                    placeholder="Write direct feedback or training instructions..."
                                                    value={feedbackContent}
                                                    onChange={(e) => setFeedbackContent(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_instruction"
                                                    className="rounded text-primary-600 focus:ring-primary-500"
                                                    checked={isInstruction}
                                                    onChange={(e) => setIsInstruction(e.target.checked)}
                                                />
                                                <label htmlFor="is_instruction" className="text-sm text-gray-700">
                                                    Mark as Training Instruction
                                                </label>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={submittingFeedback || !feedbackContent.trim()}
                                                className="w-full btn btn-primary flex items-center justify-center p-3 rounded-xl font-bold shadow-lg shadow-primary-200 disabled:opacity-50"
                                            >
                                                {submittingFeedback ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <>
                                                        <Send size={18} className="mr-2" />
                                                        Send to {athlete?.user?.first_name}
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};
