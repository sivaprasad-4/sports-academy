import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { emailService } from '../services';
import api from '../services/api';
import { User, Lock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Use the generated hero asset
    const heroBg = "C:/Users/Harishankar/.gemini/antigravity/brain/823a119b-1f7b-43ec-a3cc-8636d61183ed/sports_academy_hero_auth_1773824876863.png";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setUnverifiedEmail('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            let detail = err.response?.data?.detail;
            let email = err.response?.data?.unverified_email;
            
            // DRF ValidationError wraps strings in arrays
            if (Array.isArray(detail)) detail = detail[0];
            if (Array.isArray(email)) email = email[0];
            
            if (detail === "Email not verified. Please verify your email." && email) {
                setError(detail);
                setUnverifiedEmail(email);
            } else {
                setError(detail || 'Identity Verification Failed. Check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!unverifiedEmail) return;
        setResending(true);
        setError('');
        setSuccessMsg('');
        
        try {
            const response = await api.post('/auth/resend-verification/', { email: unverifiedEmail });
            if (response.data.token) {
                 await emailService.sendVerificationEmail(unverifiedEmail, response.data.token, username);
            }
            // Always show success message even if endpoint just says "link has been sent"
            setSuccessMsg('Verification link re-dispatched. Check your inbox.');
            setUnverifiedEmail(''); // Optional: clear to hide button after clicking once
        } catch (err) {
            setError('Failed to resend verification. Please try again later.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-inter">
            {/* ── Cinematic Hero Background ────────────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroBg} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
            </div>

            {/* ── Abstract Light Elements ──────────────────────────────────────────── */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full z-0 animate-blob" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full z-0 animate-blob animation-delay-2000" />

            {/* ── Identity Entrance Container ──────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-[480px] px-6 py-12">
                <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative group overflow-hidden">
                    {/* Glass Shine Effect */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                            IDENTITY <span className="text-emerald-400">ENTRANCE</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
                            Sports Academy Management Protocol
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex flex-col gap-2 animate-shake">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                                </div>
                                {unverifiedEmail && (
                                    <button 
                                        type="button" 
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="mt-2 ml-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors self-start"
                                    >
                                        {resending ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Mail className="w-3 h-3"/>}
                                        Resend Verification Protocol
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-tight">{successMsg}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Network ID (Username)</label>
                            <div className="relative group/input">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all font-medium text-sm"
                                    placeholder="Enter your registered ID"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Key (Password)</label>
                                <Link to="/forgot-password" disable={loading} className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest hover:text-emerald-400 transition-colors">Forgot Key?</Link>
                            </div>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all font-medium text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 active:scale-95 group/btn overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    Verify Identity
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>


                    {/* Footer Info */}
                    <div className="mt-8 text-center">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                            End-to-End Encryption Active
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
