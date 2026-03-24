import { useEffect, useState, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { academyService, paymentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { 
    CreditCard, Calendar, Clock, CheckCircle, AlertCircle, 
    IndianRupee, History, Loader2, CheckCircle2, XCircle,
    TrendingUp, TrendingDown, ArrowUpRight, Zap, ShieldCheck,
    RefreshCw, Filter, Search, ChevronRight, Activity, Award, FileText
} from 'lucide-react';
import { RazorpayMockModal } from '../components/RazorpayMockModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${className}`}>
        {children}
    </div>
);

const PaymentBadge = ({ status }) => {
    const configs = {
        PAID: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ShieldCheck size={12} /> },
        PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock size={12} /> },
        OVERDUE: { color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertCircle size={12} /> },
    };
    const config = configs[status] || { color: 'text-slate-600', bg: 'bg-slate-50', icon: <Activity size={12} /> };
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${config.bg} ${config.color} border border-white/50 shadow-sm`}>
            {config.icon}
            {status}
        </span>
    );
};

const FinancialRing = ({ rate, label, color = "#0ea5e9" }) => {
    const data = [{ value: rate }, { value: 100 - rate }];
    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={36} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270}>
                        <Cell fill={color} stroke="none" />
                        <Cell fill="#f1f5f9" stroke="none" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-slate-800 tracking-tighter">{rate}%</span>
                <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">{label}</span>
            </div>
        </div>
    );
};

// ── Root Page Implementation ──────────────────────────────────────────────────

export const FeesPage = () => {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [mockModal, setMockModal] = useState({ isOpen: false, order: null, fee: null });
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        console.log('[FeesPage] Loading treasury telemetry...');
        try {
            const [feesData, historyData] = await Promise.all([
                academyService.getFees(),
                paymentService.getPaymentHistory()
            ]);
            setFees(feesData || []);
            setHistory(historyData || []);
            console.log('[FeesPage] Treasury uplink baseline established.');
        } catch (error) {
            console.error('[FeesPage] Uplink error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Automatic Status Polling for active payments
    useEffect(() => {
        let interval;
        if (activeOrder && processingId) {
            console.log(`[FeesPage] Initiating status polling for Order: ${activeOrder.order_id}`);
            interval = setInterval(async () => {
                try {
                    const data = await paymentService.checkStatus(activeOrder.order_id);
                    if (data.status === 'SUCCESS' || data.status === 'FAILED') {
                        clearInterval(interval);
                        if (data.status === 'SUCCESS') {
                            setMessage({ type: 'success', text: '✅ TRANSACTION CONFIRMED: Treasury logs synchronized.' });
                        } else {
                            setMessage({ type: 'error', text: '❌ TRANSACTION FAILED: Payment was rejected or cancelled.' });
                        }
                        setProcessingId(null);
                        setActiveOrder(null);
                        loadData();
                    }
                } catch (err) {
                    console.error("[FeesPage] Polling error:", err);
                }
            }, 5000); // Poll every 5 seconds (Requirement 4)
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeOrder, processingId, loadData]);

    const handlePayment = async (fee) => {
        setProcessingId(fee.id);
        setMessage({ type: '', text: '' });
        try {
            const order = await paymentService.createOrder(fee.id);
            setActiveOrder(order);
            
            if (order.key_id === 'placeholder_key_id') {
                setMockModal({ isOpen: true, order, fee });
                setProcessingId(null);
                return;
            }

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: "EliteSports Academy",
                description: `Payment for ${fee.description || 'Training Fee'}`,
                order_id: order.order_id,
                handler: async (response) => {
                    try {
                        setProcessingId(fee.id);
                        setMessage({ type: 'info', text: '🔍 SECURE VERIFICATION IN PROGRESS... Do not close the window.' });
                        await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        setMessage({ type: 'success', text: '✅ PAYMENT VERIFIED: Treasury logs synchronized.' });
                        loadData();
                        setProcessingId(null);
                        setActiveOrder(null);
                    } catch (err) {
                        setMessage({ type: 'error', text: '❌ SECURITY BREACH: Signature verification failed. Contact support.' });
                        setProcessingId(null);
                        setActiveOrder(null);
                    } 
                },
                prefill: {
                    name: `${user?.first_name} ${user?.last_name}`,
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                theme: { color: "#0ea5e9" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setMessage({ type: 'error', text: `❌ TRANSACTION DENIED: ${response.error.description}` });
            });
            rzp.open();
        } catch (error) {
            console.error('[FeesPage] Payment initiation error:', error);
            setMessage({ type: 'error', text: 'PROTOCOL FAILURE: Could not initialize secure channel.' });
        } finally {
            setProcessingId(null);
        }
    };

    const analytics = useMemo(() => {
        const totalPending = fees.filter(f => f.status !== 'PAID').reduce((acc, f) => acc + parseFloat(f.amount), 0);
        const totalPaid = fees.filter(f => f.status === 'PAID').reduce((acc, f) => acc + parseFloat(f.amount), 0);
        const healthRate = totalPaid + totalPending > 0 ? Math.round((totalPaid / (totalPaid + totalPending)) * 100) : 100;
        return { totalPending, totalPaid, healthRate };
    }, [fees]);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin shadow-2xl shadow-primary-500/10"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Treasury Ledger...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-10 pb-12">
                {/* Immersive Header */}
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black tracking-widest rounded-full shadow-lg">FINANCE v1.2</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Treasury Monitoring HUD</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">My Trajectory Index</h1>
                            <p className="text-slate-500 font-medium mt-1">Real-time status of your training dues and active protocol structures.</p>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-2xl flex items-center justify-between border-2 bg-white/50 backdrop-blur-md animate-in slide-in-from-right-4 duration-500 ${
                                message.type === 'success' ? 'border-emerald-500/20 text-emerald-700' : 'border-rose-500/20 text-rose-700'
                            }`}>
                                <div className="flex items-center gap-3">
                                    {message.type === 'success' ? <ShieldCheck size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-rose-500" />}
                                    <p className="text-xs font-black tracking-tight">{message.text}</p>
                                </div>
                                <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-slate-100 rounded-lg">
                                    <RefreshCw size={14} className="text-slate-400" />
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <GlassCard className="flex items-center gap-6 border-l-4 border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20 transition-all">
                                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                                    <AlertCircle size={28} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aggregate Dues</h4>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{analytics.totalPending.toFixed(2)}</p>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Pending Approval</p>
                                </div>
                            </GlassCard>
                            <GlassCard className="flex items-center gap-6 border-l-4 border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all">
                                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settled Balance</h4>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{analytics.totalPaid.toFixed(2)}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Telemetry Confirmed</p>
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    <GlassCard className="lg:w-96 flex flex-col items-center justify-center text-center relative overflow-hidden group border-none bg-slate-900 text-white shadow-2xl shadow-primary-500/20">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                        <FinancialRing rate={analytics.healthRate} label="Stability" color="#38bdf8" />
                        <div className="mt-4 space-y-2">
                            <h3 className="text-xl font-black tracking-tight">Financial Health Indicator</h3>
                            <p className="text-slate-400 text-xs font-medium px-8 leading-relaxed">
                                Percentage of training modules successfully cleared for the current cycle.
                            </p>
                            <div className="pt-4 flex justify-center gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-black">{history.length}</div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Events</div>
                                </div>
                                <div className="w-px h-8 bg-slate-800" />
                                <div className="text-center">
                                    <div className="text-lg font-black">{fees.filter(f => f.status === 'OVERDUE').length}</div>
                                    <div className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Overdue</div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Primary Fee Roster */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Invoice Modules</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Invoices</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {fees.length > 0 ? fees.map((fee) => (
                            <GlassCard 
                                key={fee.id} 
                                className={`flex items-center justify-between p-6 group transition-all duration-500 ${
                                    fee.status === 'OVERDUE' ? 'bg-rose-50/30' : 'hover:translate-y-[-4px]'
                                }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                                        fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-600 rotate-12' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <CreditCard size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black text-slate-800 tracking-tight leading-none">
                                                ₹{parseFloat(fee.amount).toFixed(2)}
                                            </span>
                                            <PaymentBadge status={fee.status} />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-600 tracking-tight">
                                            {fee.description || 'Training Protocol Access'}
                                        </h4>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            DUE BY {new Date(fee.due_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    {fee.status !== 'PAID' ? (
                                        <button
                                            onClick={() => handlePayment(fee)}
                                            disabled={processingId === fee.id}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-xl hover:shadow-primary-500/20 hover:bg-primary-600 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {processingId === fee.id ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : <Zap size={14} className="text-amber-400" />}
                                            {processingId === fee.id ? 'SYNCING...' : 'PAY NOW'}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">Confirmed</span>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        )) : (
                            <div className="col-span-full py-24 text-center">
                                <History size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Treasury channel clear. No active dues identified.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secure Payment History */}
                {history.length > 0 && (
                    <div className="space-y-6 pt-10">
                        <div className="flex items-center gap-4 px-4">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Transmission Ledger</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Logs</span>
                        </div>

                        <GlassCard className="overflow-hidden p-0 border-white/60">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 text-left">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transmission ID</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol Group</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settled</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stamp</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Verification & Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/50">
                                        {history.map((pay) => (
                                            <tr key={pay.payment_id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="text-xs font-black text-slate-900 tracking-tighter uppercase">{pay.razorpay_order_id || 'LOCAL-OR-MOCK'}</div>
                                                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">ID: {pay.payment_id}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-slate-700">{pay.fee_details?.description || 'Standard Training Protocol'}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-black text-slate-900 leading-none">₹{parseFloat(pay.amount).toFixed(2)}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-xs font-bold text-slate-500 leading-none">{new Date(pay.created_at).toLocaleDateString()}</div>
                                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 tracking-tighter">{new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                                                            pay.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
                                                        }`}>
                                                            {pay.status === 'SUCCESS' ? <ShieldCheck size={10} /> : <XCircle size={10} />}
                                                            {pay.status}
                                                        </span>
                                                        {pay.status === 'SUCCESS' && (
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedReceipt(pay.payment_id);
                                                                    setIsReceiptModalOpen(true);
                                                                }}
                                                                className="p-2 bg-slate-50 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all shadow-sm"
                                                                title="View Receipt"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
            
            <RazorpayMockModal 
                isOpen={mockModal.isOpen}
                onClose={() => setMockModal({ ...mockModal, isOpen: false })}
                order={mockModal.order}
                fee={mockModal.fee}
                onPaymentSuccess={async (response) => {
                    if (response) {
                        try {
                            setProcessingId(mockModal.fee.id);
                            setMessage({ type: 'info', text: '🔍 VERIFYING PAYMENTS... Initializing secure handshake.' });
                            await paymentService.verifyPayment(response);
                            setMessage({ type: 'success', text: '✅ PAYMENT VERIFIED: Treasury logs updated successfully.' });
                            setProcessingId(null);
                            setActiveOrder(null);
                            loadData();
                        } catch (err) {
                            setMessage({ type: 'error', text: '❌ VERIFICATION ERROR: Handshake failed or suspicious signature.' });
                            setProcessingId(null);
                            setActiveOrder(null);
                        } 
                    } else {
                        // Success already confirmed by backend (webhook or polling)
                        setMessage({ type: 'success', text: '✅ TRANSACTION CONFIRMED: Backend status synchronized.' });
                        setProcessingId(null);
                        setActiveOrder(null);
                        loadData();
                    }
                }}
            />

            <ReceiptModal 
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                paymentId={selectedReceipt}
            />
        </Layout>
    );
};
