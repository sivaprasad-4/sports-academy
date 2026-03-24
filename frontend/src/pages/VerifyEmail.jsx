import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, XCircle, RefreshCw, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your identity sequence...');
    const navigate = useNavigate();
    const effectRan = useRef(false);

    // Use the generated hero asset
    const heroBg = "C:/Users/Harishankar/.gemini/antigravity/brain/823a119b-1f7b-43ec-a3cc-8636d61183ed/sports_academy_hero_auth_1773824876863.png";

    useEffect(() => {
        if (effectRan.current) return;
        effectRan.current = true;

        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid tracking sequence. Token is missing.');
                return;
            }

            try {
                const response = await api.get(`/auth/verify-email/?token=${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Identity verified successfully.');
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. The token may be invalid or expired.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-inter">
            {/* ── Cinematic Hero Background ────────────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroBg} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30 scale-105 animate-pulse-slow rotate-180"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950" />
            </div>

            {/* ── Abstract Light Elements ──────────────────────────────────────────── */}
            <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full z-0 animate-blob" />

            {/* ── Verification Container ──────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-[480px] px-6 py-12">
                <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative group overflow-hidden flex flex-col items-center text-center">
                    
                    {/* Glass Shine Effect */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {status === 'verifying' && (
                        <>
                            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
                                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Syncing Registry</h2>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mb-6 animate-fade-in">
                                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Verification Complete</h2>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mb-6 animate-shake">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Verification Failed</h2>
                        </>
                    )}

                    <p className="text-slate-400 text-xs font-bold tracking-[0.1em] uppercase opacity-80 mb-8 max-w-[280px]">
                        {message}
                    </p>

                    {(status === 'success' || status === 'error') && (
                        <Link
                            to="/login"
                            className={`w-full py-4 rounded-xl font-black tracking-[0.2em] uppercase text-[10px] shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 active:scale-95 group/btn relative overflow-hidden ${
                                status === 'success' 
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/20 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/5'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            {status === 'success' ? 'Access Academy Node' : 'Return to Login'}
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
