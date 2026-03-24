import { X, Sparkles, ShieldCheck, Zap, Activity, Users, Settings } from 'lucide-react';

export const ChangelogModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            title: "Cinematic Auth Suite",
            description: "High-fidelity Login, Register, and Password Recovery flows with glassmorphic aesthetics.",
            icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
            tags: ["Security", "UI/UX"]
        },
        {
            title: "Consolidated Attendance Console",
            description: "A centralized hub for coaches to mark attendance and track session completion with real-time analytics.",
            icon: <Activity className="w-5 h-5 text-blue-400" />,
            tags: ["Management", "Automation"]
        },
        {
            title: "Smart Dashboard v2.0",
            description: "Role-specific layouts focusing on upcoming sessions, active batches, and growth metrics.",
            icon: <Zap className="w-5 h-5 text-amber-400" />,
            tags: ["Analytics", "Efficiency"]
        },
        {
            title: "Secure Recovery Protocol",
            description: "Robust Network ID (Username) based password reset system with EmailJS integration.",
            icon: <Settings className="w-5 h-5 text-indigo-400" />,
            tags: ["Backend", "Security"]
        },
        {
            title: "Redesigned Roster Modules",
            description: "Complete visual overhaul of Athletes, Coaches, and Batches management interfaces.",
            icon: <Users className="w-5 h-5 text-rose-400" />,
            tags: ["UI/UX", "Admin"]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-[0_32px_128px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-white/5 relative shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl -mr-16 -mt-16"></div>
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        <Sparkles size={12} className="fill-current" />
                        <span>Core Version 2.0.4</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        SYSTEM UPGRADE <span className="text-primary-400">LOG</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest opacity-60">Elite Sports Academy - UI Overhaul</p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid gap-6">
                        {sections.map((section, idx) => (
                            <div 
                                key={idx}
                                className="group relative p-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-3xl transition-all duration-300"
                            >
                                <div className="flex gap-5">
                                    <div className="p-3 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-500 h-fit">
                                        {section.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="font-bold text-white text-lg tracking-tight uppercase">{section.title}</h3>
                                            {section.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="text-[8px] font-black uppercase tracking-widest text-slate-500 px-2 py-0.5 border border-white/5 rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-slate-950/30 shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl shadow-primary-500/20"
                    >
                        Acknowledged
                    </button>
                </div>
            </div>
        </div>
    );
};
