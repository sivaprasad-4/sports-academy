import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { academyService } from '../services';
import { useAuth } from '../context/AuthContext';
import { User, Calendar, Plus, Mail, Phone, BookOpen, Save, X, Award, Briefcase, GraduationCap, ChevronRight, Hash, Activity, Edit3 } from 'lucide-react';

export const CoachesPage = () => {
    const { user } = useAuth();
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingCoach, setEditingCoach] = useState(null); // null = create mode
    const [coachFormData, setCoachFormData] = useState({
        user_data: {
            username: '',
            password: '',
            password_confirm: '',
            email: '',
            first_name: '',
            last_name: '',
            phone: '',
        },
        specialization: '',
        experience_years: 0,
        certifications: ''
    });

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            const data = await academyService.getCoaches();
            setCoaches(data);
        } catch (error) {
            console.error('Failed to load coaches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setEditingCoach(null);
        setCoachFormData({
            user_data: {
                username: '',
                password: '',
                password_confirm: '',
                email: '',
                first_name: '',
                last_name: '',
                phone: '',
            },
            specialization: '',
            experience_years: 0,
            certifications: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (coach) => {
        setEditingCoach(coach);
        setCoachFormData({
            user_data: {
                username: coach.user.username,
                password: '', // Not used in edit
                password_confirm: '',
                email: coach.user.email,
                first_name: coach.user.first_name,
                last_name: coach.user.last_name,
                phone: coach.user.phone || '',
            },
            specialization: coach.specialization,
            experience_years: coach.experience_years,
            certifications: coach.certifications || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!editingCoach && coachFormData.user_data.password !== coachFormData.user_data.password_confirm) {
            alert("Passwords don't match!");
            return;
        }

        setSaving(true);
        try {
            if (editingCoach) {
                // For update, we don't send passwords
                const { password, password_confirm, ...userData } = coachFormData.user_data;
                const updateData = {
                    ...coachFormData,
                    user_data: userData
                };
                await academyService.updateCoach(editingCoach.id, updateData);
            } else {
                await academyService.createCoach(coachFormData);
            }
            setShowModal(false);
            loadCoaches();
        } catch (error) {
            console.error('Failed to save coach:', error);
            
            let errorMessage = `Failed to ${editingCoach ? 'update' : 'create'} coach profile.`;
            
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'object') {
                    // Extract field-level errors (e.g., { "user_data": { "username": ["..."] } })
                    const messages = [];
                    
                    const extractErrors = (obj, prefix = '') => {
                        for (const key in obj) {
                            const val = obj[key];
                            if (Array.isArray(val)) {
                                messages.push(`${prefix}${key}: ${val.join(', ')}`);
                            } else if (typeof val === 'object' && val !== null) {
                                extractErrors(val, `${key} > `);
                            } else {
                                messages.push(`${key}: ${val}`);
                            }
                        }
                    };
                    
                    extractErrors(data);
                    if (messages.length > 0) {
                        errorMessage = messages.join('\n');
                    }
                } else if (typeof data === 'string' && !data.includes('<!DOCTYPE html>')) {
                    errorMessage = data;
                }
            }
            
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        );
    }

    const avgExperience = coaches.length > 0 
        ? (coaches.reduce((acc, c) => acc + c.experience_years, 0) / coaches.length).toFixed(1)
        : 0;

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-xl animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-xl animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase text-center">Identifying Academy Experts...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Our Coaches</h1>
                        <p className="text-slate-500 font-medium mt-1">Meet the experts driving professional excellence.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <StatSummary 
                            label="Total Coaches" 
                            value={coaches.length} 
                            icon={<User size={18} />} 
                            color="text-primary-600" 
                            bgColor="bg-primary-50" 
                        />
                        <StatSummary 
                            label="Avg Experience" 
                            value={`${avgExperience}y`} 
                            icon={<Award size={18} />} 
                            color="text-amber-600" 
                            bgColor="bg-amber-50" 
                        />
                        {user.role === 'ADMIN' && (
                            <button
                                onClick={handleOpenModal}
                                className="flex items-center space-x-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                <Plus size={18} />
                                <span>Add Expert</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Coaches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {coaches.map((coach) => (
                        <div key={coach.id} className="group glass-card overflow-hidden hover:border-primary-200 transition-all duration-300">
                            {/* Profile Header */}
                            <div className="p-6 pb-0 flex items-start justify-between">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center border-2 border-white shadow-inner overflow-hidden">
                                        {coach.user.profile_picture ? (
                                            <img src={coach.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-primary-600" size={36} />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
                                        <Award size={12} className="text-amber-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:border-primary-100 transition-colors">
                                        {coach.experience_years}y Exp
                                    </div>
                                    {user.role === 'ADMIN' && (
                                        <button 
                                            onClick={() => handleOpenEdit(coach)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Edit Profile"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Coach Info */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
                                        {coach.user.first_name} {coach.user.last_name}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{coach.specialization}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 text-slate-500">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Mail size={14} />
                                        </div>
                                        <span className="text-xs font-bold truncate">{coach.user.email}</span>
                                    </div>
                                    {coach.user.phone && (
                                        <div className="flex items-center space-x-3 text-slate-500">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-xs font-bold leading-none">{coach.user.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <GraduationCap size={14} className="text-slate-300" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credentials</p>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium line-clamp-2">
                                        {coach.certifications || 'Verified Professional Coach'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Action Footer */}
                            <div className="px-6 py-4 bg-slate-50/50 flex justify-between items-center group-hover:bg-primary-50/50 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary-600">Full Profile</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 transform group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                    
                    {coaches.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 glass-card text-center space-y-4">
                            <Activity size={48} className="text-slate-200" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Coaching Bench Empty</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">No coach accounts have been provisioned yet.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
                        <button 
                            onClick={() => setShowModal(false)} 
                            className="absolute top-8 right-8 z-50 p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            <X size={24} />
                        </button>
                        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-white z-20 px-10 pt-10 pb-6 mb-2 flex justify-between items-center border-b border-slate-100/50">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {editingCoach ? 'Refine Expert' : 'Provision Expert'}
                                    </h2>
                                    <p className="text-slate-500 font-medium mt-1">
                                        {editingCoach ? 'Update professional biometric data.' : 'Deploy a new professional account.'}
                                    </p>
                                </div>
                                <div className="w-12 h-12"></div> {/* Spacer for the absolute button */}
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 pt-2 space-y-8">
                                {/* Section 1: Identity */}
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-1.5 h-4 bg-primary-600 rounded-full"></div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Identity & Access</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <CustomInput 
                                            label="First Name" 
                                            value={coachFormData.user_data.first_name}
                                            onChange={(val) => setCoachFormData({
                                                ...coachFormData,
                                                user_data: { ...coachFormData.user_data, first_name: val }
                                            })}
                                        />
                                        <CustomInput 
                                            label="Last Name" 
                                            value={coachFormData.user_data.last_name}
                                            onChange={(val) => setCoachFormData({
                                                ...coachFormData,
                                                user_data: { ...coachFormData.user_data, last_name: val }
                                            })}
                                        />
                                        <CustomInput 
                                            label="Username" 
                                            value={coachFormData.user_data.username}
                                            onChange={(val) => setCoachFormData({
                                                ...coachFormData,
                                                user_data: { ...coachFormData.user_data, username: val }
                                            })}
                                            readOnly={!!editingCoach}
                                        />
                                        <CustomInput 
                                            label="Email Path" 
                                            type="email"
                                            value={coachFormData.user_data.email}
                                            onChange={(val) => setCoachFormData({
                                                ...coachFormData,
                                                user_data: { ...coachFormData.user_data, email: val }
                                            })}
                                        />
                                        {!editingCoach && (
                                            <>
                                                <CustomInput 
                                                    label="Secure Password" 
                                                    type="password"
                                                    value={coachFormData.user_data.password}
                                                    onChange={(val) => setCoachFormData({
                                                        ...coachFormData,
                                                        user_data: { ...coachFormData.user_data, password: val }
                                                    })}
                                                />
                                                <CustomInput 
                                                    label="Confirm Secret" 
                                                    type="password"
                                                    value={coachFormData.user_data.password_confirm}
                                                    onChange={(val) => setCoachFormData({
                                                        ...coachFormData,
                                                        user_data: { ...coachFormData.user_data, password_confirm: val }
                                                    })}
                                                />
                                            </>
                                        )}
                                        {editingCoach && (
                                            <CustomInput 
                                                label="Active Contact" 
                                                placeholder="+0 000 000 000"
                                                value={coachFormData.user_data.phone}
                                                onChange={(val) => setCoachFormData({
                                                    ...coachFormData,
                                                    user_data: { ...coachFormData.user_data, phone: val }
                                                })}
                                                required={false}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Section 2: Professional */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Coach Profile</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <CustomInput 
                                            label="Specialization" 
                                            placeholder="e.g. Master Pitcher"
                                            value={coachFormData.specialization}
                                            onChange={(val) => setCoachFormData({ ...coachFormData, specialization: val })}
                                        />
                                        <CustomInput 
                                            label="Experience (Years)" 
                                            type="number"
                                            value={coachFormData.experience_years}
                                            onChange={(val) => setCoachFormData({ ...coachFormData, experience_years: parseInt(val) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Certifications</label>
                                        <textarea
                                            value={coachFormData.certifications}
                                            onChange={(e) => setCoachFormData({ ...coachFormData, certifications: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none h-24 resize-none"
                                            placeholder="ISO-9001, Olympic Coach Certified..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-8 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex-1 md:flex-none flex items-center justify-center space-x-2"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <span className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>{editingCoach ? 'Syncing Profile...' : 'Deploying Account...'}</span>
                                            </span>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>{editingCoach ? 'Update Expert' : 'Finalize Deployment'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

const StatSummary = ({ label, value, icon, color, bgColor }) => (
    <div className="flex items-center space-x-3 px-5 py-3 glass-card bg-white/40 backdrop-blur-md border-white/60">
        <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

const CustomInput = ({ label, type = "text", value, onChange, placeholder = "", required = true, readOnly = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            className={`w-full px-5 py-4 border-none rounded-2xl text-sm font-bold transition-all outline-none ${
                readOnly 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-slate-50 text-slate-700 focus:ring-4 focus:ring-primary-500/5"
            }`}
            placeholder={placeholder}
            required={required}
        />
    </div>
);
