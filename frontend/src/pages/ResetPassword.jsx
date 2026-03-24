import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle, ArrowLeft, KeySquare } from 'lucide-react';
import api from '../services/api';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const heroBg = "C:/Users/Harishankar/.gemini/antigravity/brain/823a119b-1f7b-43ec-a3cc-8636d61183ed/sports_academy_hero_auth_1773824876863.png";

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Security strings do not match. Please recalibrate.');
            return;
        }

        if (password.length < 8) {
            setError('Security key must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password/', { 
                token: token,
                new_password: password 
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Password reset failed:', err);
            setError(err.response?.data?.error || 'Authorization link is invalid or has expired. Please request a new signal.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
                <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">Invalid Access Port</h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium">Reset token missing. Return to login and initialize recovery protocol.</p>
                    <Link to="/login" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all inline-block">
                        Back to Headquarters
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-inter">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroBg} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-[480px] px-6 py-12">
                <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-6 font-black uppercase tracking-widest text-emerald-400">
                            <KeySquare className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                            KEY <span className="text-emerald-400">RECALIBRATION</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
                            Establish New Security Protocol
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">New Security Key</label>
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

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Confirm Key</label>
                                <div className="relative group/input">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Updating Protocol...
                                    </>
                                ) : (
                                    <>
                                        Authorize Update
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-8 py-4 animate-in fade-in duration-700">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Key Recalibrated</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Your security protocol has been successfully updated. Redirecting to headquarters for verification...
                                </p>
                            </div>
                            <div className="pt-4">
                                <div className="w-12 h-1 overflow-hidden bg-slate-800 rounded-full mx-auto">
                                    <div className="w-full h-full bg-emerald-500 origin-left animate-loading-bar" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
