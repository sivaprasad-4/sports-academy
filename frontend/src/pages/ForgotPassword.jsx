import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { emailService } from '../services';

export const ForgotPassword = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const heroBg = "C:/Users/Harishankar/.gemini/antigravity/brain/823a119b-1f7b-43ec-a3cc-8636d61183ed/sports_academy_hero_auth_1773824876863.png";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Request token from backend using username
            const response = await api.post('/auth/forgot-password/', { username });
            
            // 2. If token and email returned, send email via EmailJS
            if (response.data.token && response.data.email) {
                await emailService.sendResetEmail(response.data.email, response.data.token, username);
            }
            
            // 3. Show success (even if email doesn't exist, for security)
            setSuccess(true);
        } catch (err) {
            console.error('Password reset request failed:', err);
            setError(err.response?.data?.error || 'Failed to initialize reset protocol. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                            <ShieldCheck className="w-10 h-10" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                            RECOVERY <span className="text-emerald-400">SIGNAL</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase opacity-60">
                            Initialize Password Reset Protocol
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Network ID (Username)</label>
                                <div className="relative group/input">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800/80 transition-all font-medium text-sm"
                                        placeholder="Enter your registered username"
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
                                        Transmitting Signal...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
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
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Signal Successfully Sent</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    If this Network ID exists, you will receive a transformation link at your registered email address shortly. Please verify your inbox and spam folders.
                                </p>
                            </div>
                            <Link 
                                to="/login"
                                className="inline-flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px] hover:text-emerald-300 transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Back to Headquarters
                            </Link>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-sm text-slate-500 font-medium font-inter">
                            Remember your credentials?{' '}
                            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-widest transition-colors inline-flex items-center gap-1 group/link focus:outline-none">
                                Return to Access
                                <ArrowRight className="w-3 h-3 translate-y-[1px] group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
