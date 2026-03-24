import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, emailService } from '../services';
import { User, Mail, Lock, Phone, ShieldPlus, ArrowRight, RefreshCw, AlertCircle, Zap, CheckCircle } from 'lucide-react';

export const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'ATHLETE',
        phone: '',
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Use the generated hero asset
    const heroBg = "C:/Users/Harishankar/.gemini/antigravity/brain/823a119b-1f7b-43ec-a3cc-8636d61183ed/sports_academy_hero_auth_1773824876863.png";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (formData.password !== formData.password_confirm) {
            setError('Biometric Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.register(formData);
            
            // Try sending the verification email, but don't block login navigation if it fails just yet,
            // or we can show success and then navigate.
            try {
                 await emailService.sendVerificationEmail(
                     formData.email, 
                     response.verification_token, 
                     formData.first_name || formData.username
                 );
                 setSuccessMsg('Registry Sync Complete. Verification Protocol dispatched to your email. Redirecting...');
                 
                 setTimeout(() => {
                     navigate('/login', { state: { message: 'Please verify your email to gain full access to the Academy.' } });
                 }, 4000);
            } catch (emailErr) {
                 console.error("Email dispatch failed", emailErr);
                 // Even if email fails, account is created, they can use 'resend' on login page.
                 navigate('/login', { state: { message: 'Registry Successful, but email dispatch failed. Please use "Resend Verification" when logging in.' } });
            }
            
        } catch (err) {
            const errorMsg = err.response?.data;
            if (typeof errorMsg === 'object') {
                const firstError = Object.values(errorMsg)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError('Registry Sync Failed. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-inter py-12 px-4">
            {/* ── Cinematic Hero Background ────────────────────────────────────────── */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={heroBg} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30 scale-105 animate-pulse-slow rotate-180"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/40 to-slate-950" />
            </div>

            {/* ── Abstract Light Elements ──────────────────────────────────────────── */}
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[180px] rounded-full z-0 animate-blob" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full z-0 animate-blob animation-delay-2000" />

            {/* ── Registry Container ──────────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-[900px]">
                <div className="backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[4rem] p-8 md:p-16 shadow-[0_48px_150px_-30px_rgba(0,0,0,0.9)] relative group overflow-hidden">
                    {/* Glass Shine */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div>
                            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-4">
                                <ShieldPlus className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                                REGISTRY <span className="text-emerald-400">INITIALIZATION</span>
                            </h1>
                            <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase opacity-60 mt-2">
                                New Academy Recruit Protocol
                            </p>
                        </div>
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</div>
                            <div className="flex items-center gap-2 justify-end">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Gateway Open</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-3xl flex items-center gap-3 animate-shake">
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                            </div>
                        )}
                        
                        {successMsg && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-3xl flex items-center gap-3 animate-fade-in">
                                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                                <p className="text-xs font-black uppercase tracking-tight">{successMsg}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Personal Info Group */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] pb-2 border-b border-white/5">Biometric Identity</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                            placeholder="John"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                            placeholder="Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Email Address</label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within/input:text-emerald-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                            placeholder="john.doe@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Phone Link (Optional)</label>
                                    <div className="relative group/input">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within/input:text-emerald-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Access Protocol Group */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] pb-2 border-b border-white/5">Access Protocol</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Network ID (Username)</label>
                                    <div className="relative group/input">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within/input:text-blue-400" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                            placeholder="johndoe_athlete"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Assigned Role</label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="ATHLETE">Academy Athlete</option>
                                            <option value="COACH">Instructional Staff (Coach)</option>
                                            <option value="ADMIN">System Administrator</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                            <Zap className="w-4 h-4 text-blue-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Security Key</label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 transition-colors group-focus-within/input:text-blue-400" />
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                                placeholder="••••••••"
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-2">Confirm Key</label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 transition-colors group-focus-within/input:text-blue-400" />
                                            <input
                                                type="password"
                                                name="password_confirm"
                                                value={formData.password_confirm}
                                                onChange={handleChange}
                                                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                                placeholder="••••••••"
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-3xl font-black tracking-[0.3em] uppercase text-xs shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-4 active:scale-95 group/btn relative overflow-hidden"
                            >
                                <div className="absolute inset-x-0 h-[100%] w-20 bg-white/20 -skew-x-[45deg] -translate-x-full group-hover/btn:translate-x-[600px] transition-transform duration-1000 ease-in-out" />
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Synchronizing Registry...
                                    </>
                                ) : (
                                    <>
                                        Initialize Account Registry
                                        <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-500 font-medium tracking-tight">
                            Already part of the roster?{' '}
                            <Link to="/login" className="text-white hover:text-emerald-400 font-black uppercase tracking-[0.15em] transition-colors inline-flex items-center gap-2 group/link">
                                Return to Entrance
                                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                        <div className="h-px w-24 bg-white/5" />
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">
                            Global Recruitment Active • SECURE NODE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
