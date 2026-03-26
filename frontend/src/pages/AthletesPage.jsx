import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { academyService, authService } from '../services';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, ShieldAlert, Plus, X, Edit2, Users, CheckCircle2, AlertCircle, Filter, Search as SearchIcon, Award, Zap } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import emailjs from 'emailjs-com';


export const AthletesPage = () => {
    const { user } = useAuth();
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [batches, setBatches] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAthleteId, setCurrentAthleteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBatch, setFilterBatch] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        // User Details
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        role: 'ATHLETE',

        // Athlete Details
        height: '',
        weight: '',
        emergency_contact: '',
        medical_notes: '',
        batch: ''
    });

    useEffect(() => {
        loadAthletes();
        if (user.role === 'ADMIN') {
            loadBatches();
        }
    }, [user.role]);

    const loadAthletes = async () => {
        try {
            const data = await academyService.getAthletes();
            setAthletes(data);
        } catch (error) {
            console.error('Failed to load athletes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBatches = async () => {
        try {
            const data = await academyService.getBatches();
            setBatches(data);
        } catch (error) {
            console.error('Failed to load batches:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (athlete) => {
        setIsEditing(true);
        setCurrentAthleteId(athlete.id);
        setFormData({
            username: athlete.user.username || '',
            email: athlete.user.email || '',
            password: '',
            password_confirm: '',
            first_name: athlete.user.first_name || '',
            last_name: athlete.user.last_name || '',
            phone: athlete.user.phone || '',
            date_of_birth: athlete.user.date_of_birth || '',
            role: 'ATHLETE',
            height: athlete.height || '',
            weight: athlete.weight || '',
            emergency_contact: athlete.emergency_contact || '',
            medical_notes: athlete.medical_notes || '',
            batch: athlete.batch || ''
        });
        setShowModal(true);
    };

    const handleAddClick = () => {
        setIsEditing(false);
        setCurrentAthleteId(null);
        setFormData({
            username: '', email: '', password: '', password_confirm: '',
            first_name: '', last_name: '', phone: '', date_of_birth: '', role: 'ATHLETE',
            height: '', weight: '', emergency_contact: '', medical_notes: '', batch: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting form. isEditing:', isEditing, 'currentAthleteId:', currentAthleteId);
        try {
            if (isEditing) {
                const payload = {
                    user_data: {
                        username: formData.username,
                        email: formData.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        date_of_birth: formData.date_of_birth,
                    },
                    height: formData.height || null,
                    weight: formData.weight || null,
                    emergency_contact: formData.emergency_contact,
                    medical_notes: formData.medical_notes,
                    batch: formData.batch || null
                };
                console.log('Update payload:', payload);
                await academyService.updateAthlete(currentAthleteId, payload);
                console.log('Athlete updated successfully!');
            } else {
                // 1. Register User
                const userPayload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    password_confirm: formData.password_confirm,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    date_of_birth: formData.date_of_birth,
                    role: 'ATHLETE'
                };
                console.log('Registering user:', userPayload);
                const newUser = await authService.register(userPayload);

                // 2. Create Athlete Profile
                const profilePayload = {
                    user_id: newUser.id,
                    height: formData.height || null,
                    weight: formData.weight || null,
                    emergency_contact: formData.emergency_contact,
                    medical_notes: formData.medical_notes,
                    batch: formData.batch || null
                };
                console.log('Creating profile:', profilePayload);
                await academyService.createAthlete(profilePayload);
                console.log('Athlete added successfully!');

                // 3. Send Automated Enrollment Email
                try {
                    await emailjs.send(
                        'service_l1wmrkj',
                        'template_whont0d',
                        {
                            athlete_name: formData.first_name,
                            email: formData.email,
                            username: formData.username,
                            password: formData.password,
                            academy_name: "Sports Academy"
                        },
                        'xgmGUFOFwEkvrJWgI'
                    );
                    console.log('Enrollment email sent successfully');
                    
                    // Cleanup and reload for successful creation + email
                    setShowModal(false);
                    loadAthletes();
                    alert('Athlete enrolled and email sent successfully');
                    return;
                } catch (emailError) {
                    console.error('Failed to send enrollment email:', emailError);
                    
                    // Cleanup and reload but warn about email failure
                    setShowModal(false);
                    loadAthletes();
                    alert('Athlete created, but email failed to send');
                    return;
                }
            }

            // Cleanup and Reload for Edit flow
            setShowModal(false);
            loadAthletes();
            alert('Athlete updated successfully!');

        } catch (error) {
            console.error('Failed to save athlete:', error);
            let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} athlete.`;
            if (error.response && error.response.data) {
                // Format validation errors
                const details = Object.entries(error.response.data)
                    .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : JSON.stringify(msgs)}`)
                    .join('\n');
                errorMessage += `\n\nDetails:\n${details}`;
            } else {
                errorMessage += `\n\nError: ${error.message}`;
            }
            alert(errorMessage);
        }
    };

    const filteredAthletes = athletes.filter(athlete => {
        const matchesSearch = 
            `${athlete.user.first_name} ${athlete.user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            athlete.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            athlete.user.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesBatch = filterBatch === 'all' || athlete.batch?.toString() === filterBatch;
        
        return matchesSearch && matchesBatch;
    });

    const activeCount = athletes.filter(a => a.batch).length;
    const unassignedCount = athletes.filter(a => !a.batch).length;

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary-100 rounded-xl animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-primary-600 rounded-xl animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Loading Roster...</p>
                </div>
            </Layout>
        );
    }

    if (user.role === 'ATHLETE') {
        return <Navigate to="/dashboard" replace />;
    }

    return (

        <Layout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header & Stats Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Athlete Directory</h1>
                        <p className="text-slate-500 font-medium mt-1">Manage and track performance profiles across the academy.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <StatSummary 
                            label="Total" 
                            value={athletes.length} 
                            icon={<Users size={18} />} 
                            color="text-primary-600" 
                            bgColor="bg-primary-50" 
                        />
                        <StatSummary 
                            label="Active" 
                            value={activeCount} 
                            icon={<CheckCircle2 size={18} />} 
                            color="text-emerald-600" 
                            bgColor="bg-emerald-50" 
                        />
                        <StatSummary 
                            label="Unassigned" 
                            value={unassignedCount} 
                            icon={<AlertCircle size={18} />} 
                            color="text-amber-600" 
                            bgColor="bg-amber-50" 
                        />
                        {user.role === 'ADMIN' && (
                            <button
                                onClick={handleAddClick}
                                className="flex items-center space-x-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95 group"
                            >
                                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                                <span>Add Athlete</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Toolbar: Search & Filter */}
                <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name, username or email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-4 focus:ring-primary-500/5 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <CustomSelect
                            placeholder="All Batches"
                            icon={Filter}
                            options={[
                                { value: 'all', label: 'All Batches' },
                                ...batches.map(b => ({ value: b.id, label: b.name }))
                            ]}
                            value={filterBatch}
                            onChange={(e) => setFilterBatch(e.target.value)}
                            className="min-w-[200px]"
                        />
                    </div>
                </div>

                {/* Athlete Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAthletes.map((athlete) => (
                        <div key={athlete.id} className="group glass-card hover-lift p-6 relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-inner overflow-hidden border-2 border-white">
                                            {athlete.user.profile_picture ? (
                                                <img src={athlete.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="opacity-80" size={32} />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                                            <div className={`w-2 h-2 rounded-full ${athlete.batch ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                                            {athlete.user.first_name} {athlete.user.last_name}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                                                {athlete.batch_name || 'Unassigned'}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 italic">@{athlete.user.username}</span>
                                        </div>
                                    </div>
                                </div>

                                {user.role === 'ADMIN' && (
                                    <button
                                        onClick={() => handleEditClick(athlete)}
                                        className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                        title="Edit Profile"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <MetricBadge label="Height" value={athlete.height ? `${athlete.height} cm` : '--'} />
                                <MetricBadge label="Weight" value={athlete.weight ? `${athlete.weight} kg` : '--'} />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-50 text-slate-500 font-medium text-xs">
                                <div className="flex items-center group/item cursor-default">
                                    <Calendar size={14} className="mr-3 text-slate-300 group-hover/item:text-primary-500 transition-colors" />
                                    <span>Enrolled: {athlete.enrollment_date}</span>
                                </div>
                                <div className="flex items-center group/item cursor-default">
                                    <Mail size={14} className="mr-3 text-slate-300 group-hover/item:text-primary-500 transition-colors" />
                                    <span className="truncate">{athlete.user.email}</span>
                                </div>
                                <div className="flex items-center group/item cursor-default">
                                    <Phone size={14} className="mr-3 text-slate-300 group-hover/item:text-primary-500 transition-colors" />
                                    <span>{athlete.emergency_contact || 'No emergency contact'}</span>
                                </div>
                            </div>

                            {athlete.medical_notes && (
                                <div className="mt-5 p-3 rounded-2xl bg-rose-50 border border-rose-100/50">
                                    <div className="flex items-center text-rose-700 text-[10px] font-black uppercase tracking-widest mb-1">
                                        <ShieldAlert size={12} className="mr-2" /> Medical Attention
                                    </div>
                                    <p className="text-[11px] text-rose-600 line-clamp-2 leading-relaxed font-medium">{athlete.medical_notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {filteredAthletes.length === 0 && (
                        <div className="col-span-full py-20 glass-card text-center">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Athletes Found</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>

                {/* Athlete Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-1 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                            {isEditing ? 'Edit Profile' : 'New Athlete'}
                                        </h2>
                                        <p className="text-slate-500 font-medium">Configure account and sports profile.</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowModal(false)} 
                                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    {/* Account Information */}
                                    <section>
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <User size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Details</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <CustomField label="First Name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
                                            <CustomField label="Last Name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
                                            <CustomField label="Username" name="username" value={formData.username} onChange={handleInputChange} required />
                                            <CustomField label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                                            {!isEditing && (
                                                <>
                                                    <CustomField label="Set Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength="8" />
                                                    <CustomField label="Confirm Password" type="password" name="password_confirm" value={formData.password_confirm} onChange={handleInputChange} required minLength="8" />
                                                </>
                                            )}
                                            <CustomField label="Contact Phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                                            <CustomField label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                                        </div>
                                    </section>

                                    {/* Athlete Profile */}
                                    <section>
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Award size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Athlete Bio-Metrics</h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <CustomSelect
                                                label="Assigned Batch"
                                                name="batch"
                                                icon={Zap}
                                                placeholder="Select Batch"
                                                options={batches.map(b => ({ value: b.id, label: `${b.name} (${b.sport_name})` }))}
                                                value={formData.batch}
                                                onChange={handleInputChange}
                                            />
                                            <CustomField label="Emergency Contact (Parent)" type="tel" name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} />
                                            <CustomField label="Height (cm)" type="number" name="height" value={formData.height} onChange={handleInputChange} step="0.1" />
                                            <CustomField label="Weight (kg)" type="number" name="weight" value={formData.weight} onChange={handleInputChange} step="0.1" />
                                            
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical Observations</label>
                                                <textarea 
                                                    name="medical_notes" 
                                                    value={formData.medical_notes} 
                                                    onChange={handleInputChange} 
                                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none h-32 resize-none" 
                                                    placeholder="Allergies, chronic conditions, injuries..." 
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="flex justify-end space-x-4 pt-8 border-t border-slate-50">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowModal(false)} 
                                            className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                                        >
                                            Discard Changes
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                                        >
                                            {isEditing ? 'Save Changes' : 'Onboard Athlete'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const StatSummary = ({ label, value, icon, color, bgColor }) => (
    <div className="flex items-center space-x-3 px-5 py-3 glass-card">
        <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

const MetricBadge = ({ label, value }) => (
    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-slate-900 tracking-tight">{value}</p>
    </div>
);

const CustomField = ({ label, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input 
            {...props} 
            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none placeholder:text-slate-300" 
        />
    </div>
);
