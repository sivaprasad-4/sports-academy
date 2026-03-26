import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect - A premium, glassmorphic dropdown component.
 * 
 * @param {Array} options - List of { value, label } objects.
 * @param {any} value - Currently selected value.
 * @param {function} onChange - Callback function triggered on selection.
 * @param {string} placeholder - Text shown when no value is selected.
 * @param {React.ElementType} icon - Optional Lucide icon component.
 * @param {string} label - Optional label text shown above the dropdown.
 * @param {string} className - Optional additional CSS classes.
 */
const CustomSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Select...", 
    icon: Icon = null,
    label = "",
    name = "",
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Find the current selection for display
    const selectedOption = options.find(opt => String(opt.value) === String(value));

    // Handle click outside to close the menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle internal selection
    const handleSelect = (val) => {
        if (disabled) return;
        // Mock the event object to maintain compatibility with existing handlers
        onChange({ target: { name, value: val } });
        setIsOpen(false);
    };

    return (
        <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 pointer-events-none">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between gap-3
                        bg-white/70 backdrop-blur-xl border border-white/40 
                        rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700
                        shadow-[0_4px_12px_rgba(31,38,135,0.03)] hover:shadow-[0_8px_24px_rgba(31,38,135,0.08)]
                        hover:bg-white/95 focus:outline-none focus:ring-4 focus:ring-indigo-500/10
                        transition-all duration-300 group
                        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                    `}
                >
                    <div className="flex items-center gap-3 truncate">
                        {Icon && (
                            <div className={`transition-colors duration-300 ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`}>
                                <Icon size={18} />
                            </div>
                        )}
                        <span className={`truncate leading-none ${selectedOption ? "text-slate-800" : "text-slate-400"}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown 
                        size={18} 
                        className={`text-slate-400 shrink-0 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-slate-600'}`} 
                    />
                </button>

                {/* Animated Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 z-[100] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
                        <div className="bg-white/95 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-[0_20px_50px_rgba(31,38,135,0.15)] max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar ring-1 ring-black/5">
                            {options.map((opt, idx) => {
                                const isSelected = String(value) === String(opt.value);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`
                                            w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                                            text-sm font-bold transition-all duration-200 group/item
                                            ${isSelected 
                                                ? 'bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.3)]' 
                                                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}
                                        `}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && (
                                            <div className="animate-in zoom-in duration-300">
                                                <Check size={16} strokeWidth={3} className="text-emerald-400" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                            {options.length === 0 && (
                                <div className="px-4 py-10 text-center flex flex-col items-center gap-2 opacity-30">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Icon size={16} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Void Selection</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
