import { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { academyService, authService } from '../services';
import { useAuth } from '../context/AuthContext';
import {
    User, Mail, Phone, Calendar, Award, Layers,
    Save, Camera, ShieldAlert, FileText, CheckCircle, RefreshCw
} from 'lucide-react';

// ── Shared UI Components ────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }) => (
    <div className={`backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] ${className.includes('bg-') ? className : `bg-white/90 ${className}`}`}>
        {children}
    </div>
);

const IdentityModule = ({ label, value, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/40 transition-all hover:bg-white/80">
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-900 leading-none">{value || 'NOT SPECIFIED'}</p>
        </div>
    </div>
);

export const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        // Athlete fields
        emergency_contact: '',
        medical_notes: '',
        // Coach fields
        specialization: '',
        experience_years: '',
        certifications: ''
    });

    const isAthlete = user?.role === 'ATHLETE';
    const isCoach = user?.role === 'COACH';

    useEffect(() => {
        loadProfile();
    }, [user?.role]);

    const loadProfile = async () => {
        try {
            let data = null;
            if (isAthlete) {
                data = await academyService.getMyAthleteProfile();
            } else if (isCoach) {
                data = await academyService.getMyCoachProfile();
            } else {
                // Admin: just get user info
                data = { user: await authService.getProfile() };
            }
            
            setProfile(data);
            setFormData({
                phone: data.user.phone || '',
                email: data.user.email || '',
                emergency_contact: data.emergency_contact || '',
                medical_notes: data.medical_notes || '',
                specialization: data.specialization || '',
                experience_years: data.experience_years || '0',
                certifications: data.certifications || ''
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Fallback for users without an academy profile
            setProfile({ user });
            setFormData({
                phone: user.phone || '',
                email: user.email || '',
                emergency_contact: '',
                medical_notes: '',
                specialization: '',
                experience_years: '0',
                certifications: ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        const data = new FormData();
        data.append('profile_picture', file);

        try {
            const updatedUser = await authService.updateProfile(data);
            updateUser(updatedUser);
            setProfile(prev => ({ ...prev, user: updatedUser }));
            setMessage({ type: 'success', text: 'BIOMETRIC SCAN COMPLETE: Photo updated.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            console.error('Photo upload failed:', error);
            setMessage({ type: 'error', text: 'SCAN FAILURE: Could not upload biometric data.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const updatedUser = await authService.updateProfile({ phone: formData.phone });
            updateUser(updatedUser);
            
            let updatedExtra = {};
            if (isAthlete) {
                updatedExtra = await academyService.updateMyAthleteProfile({
                    emergency_contact: formData.emergency_contact,
                    medical_notes: formData.medical_notes
                });
            } else if (isCoach) {
                updatedExtra = await academyService.updateMyCoachProfile({
                    specialization: formData.specialization,
                    experience_years: parseInt(formData.experience_years),
                    certifications: formData.certifications
                });
            }

            setProfile({ ...updatedExtra, user: updatedUser });
            setMessage({ type: 'success', text: 'PROTOCOL SYNC COMPLETE: Identity updated.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            const errorData = error.response?.data;
            let errorMsg = 'Could not connect to Identity Server.';
            
            if (errorData) {
                if (typeof errorData === 'string') errorMsg = errorData;
                else if (errorData.error) errorMsg = errorData.error;
                else if (errorData.detail) errorMsg = errorData.detail;
                else errorMsg = JSON.stringify(errorData);
            }
            
            setMessage({ type: 'error', text: `SYNC FAILURE: ${errorMsg}` });
        } finally {
            setSaving(false);
        }
    };

    const calculateTenure = (date) => {
        if (!date) return 'NEW RECRUIT';
        const joined = new Date(date);
        const now = new Date();
        const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
        if (months <= 0) return 'NEW RECRUIT';
        if (months < 12) return `${months} MONTHS`;
        return `${Math.floor(months / 12)}Y ${months % 12}M`;
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Synchronizing Identity...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const displayUser = profile?.user || user;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
                {/* ── Biometric Header ────────────────────────────────────────────────── */}
                <div className="relative group">
                    <div className="h-64 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-900/30 backdrop-blur-3xl"></div>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-center md:items-end gap-8 translate-y-6">
                            <div className="relative">
                                <div className="h-44 w-44 rounded-[2rem] border-8 border-white overflow-hidden bg-slate-100 shadow-2xl relative z-20 group/pic transition-transform duration-500 hover:scale-[1.02]">
                                    {displayUser.profile_picture ? (
                                        <img src={displayUser.profile_picture} alt="Profile" className="h-full w-full object-cover transition-transform duration-700 group-hover/pic:scale-110" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300 bg-slate-50">
                                            <User size={80} strokeWidth={1} />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border-4 border-white transition-all transform hover:scale-110 hover:bg-slate-800 z-30"
                                >
                                    <Camera size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
                            </div>

                            <div className="flex-1 pb-10 text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                    <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">
                                        {displayUser.first_name || displayUser.username} {displayUser.last_name || ''}
                                    </h1>
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/20 w-fit mx-auto md:mx-0">
                                        {displayUser.role} VERIFIED
                                    </span>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-white/60">
                                    {(isAthlete || isCoach) && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-indigo-400" />
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    {isAthlete ? (profile?.batch_name || 'PENDING ASSIGNMENT') : 'PROFESSIONAL STAFF'}
                                                </span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-white/20"></div>
                                        </>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Award size={14} className="text-purple-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest">
                                            {isAthlete ? (profile?.sport_name || 'UNASSIGNED') : (isCoach ? profile?.specialization : 'ADMINISTRATOR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {profile?.enrollment_date && (
                                <div className="hidden lg:flex flex-col items-end pb-10 gap-2">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Academy Tenure</p>
                                    <div className="text-3xl font-black text-white tracking-tighter">{calculateTenure(profile.enrollment_date)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                    {/* Security Modules */}
                    <div className="lg:col-span-4 space-y-6">
                        <GlassCard className="p-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                                <ShieldAlert size={12} className="text-indigo-500" />
                                Security Parameters
                            </h3>
                            <div className="space-y-4">
                                <IdentityModule label="Network ID" value={displayUser.username} icon={User} colorClass="bg-indigo-50 text-indigo-600" />
                                <IdentityModule label="Digital Contact" value={displayUser.email} icon={Mail} colorClass="bg-purple-50 text-purple-600" />
                                <IdentityModule label="Chronology (DOB)" value={displayUser.date_of_birth} icon={Calendar} colorClass="bg-amber-50 text-amber-600" />
                            </div>
                        </GlassCard>

                        <GlassCard className="p-8 bg-slate-900 border-none text-white shadow-2xl shadow-indigo-500/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                                    <Award size={24} className="text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black uppercase tracking-wider">Restricted Access</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                        Core parameters (Name, Email, Role) are protocol-locked. Contact the Central Registry for overrides.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Protocol Console (Form) */}
                    <div className="lg:col-span-8">
                        <GlassCard className="p-10 h-full">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Identity Configuration</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Modify permitted biometric fields</p>
                                </div>
                                <Save size={32} className="text-slate-100" />
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 border-2 mb-8 animate-in slide-in-from-top-4 duration-500 ${
                                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                }`}>
                                    {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                                    <p className="text-xs font-black uppercase tracking-tight leading-none">{message.text}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Phone size={12} className="text-indigo-500" />
                                            Active Link (Phone)
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                                            placeholder="+0 000 000 000"
                                        />
                                    </div>

                                    {isAthlete && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <ShieldAlert size={12} className="text-rose-500" />
                                                Emergency Override
                                            </label>
                                            <input
                                                type="text"
                                                name="emergency_contact"
                                                value={formData.emergency_contact}
                                                onChange={handleChange}
                                                className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                                                placeholder="CONTINGENCY PERSON"
                                            />
                                        </div>
                                    )}

                                    {isCoach && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Award size={12} className="text-indigo-500" />
                                                    Specialization
                                                </label>
                                                <input
                                                    type="text"
                                                    name="specialization"
                                                    value={formData.specialization}
                                                    onChange={handleChange}
                                                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300"
                                                    placeholder="e.g. Master Coach"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                    <Calendar size={12} className="text-indigo-500" />
                                                    Experience (Years)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="experience_years"
                                                    value={formData.experience_years}
                                                    onChange={handleChange}
                                                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {isAthlete && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <FileText size={12} className="text-amber-500" />
                                            Medical Telemetry (Notes)
                                        </label>
                                        <textarea
                                            name="medical_notes"
                                            value={formData.medical_notes}
                                            onChange={handleChange}
                                            className="w-full min-h-[160px] p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:italic placeholder:text-slate-300"
                                            placeholder="INPUT CRITICAL MEDICAL DATA OR RESTRICTIONS..."
                                        />
                                    </div>
                                )}

                                {isCoach && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <FileText size={12} className="text-indigo-500" />
                                            Certifications
                                        </label>
                                        <textarea
                                            name="certifications"
                                            value={formData.certifications}
                                            onChange={handleChange}
                                            className="w-full min-h-[160px] p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:italic placeholder:text-slate-300"
                                            placeholder="LIST PROFESSIONAL CREDENTIALS..."
                                        />
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={`px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${
                                            saving 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                            : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                                        }`}
                                    >
                                        {saving ? (
                                            <>
                                                <RefreshCw size={18} className="animate-spin" />
                                                SYNCHRONIZING...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                SUBMIT Identity CHANGES
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
