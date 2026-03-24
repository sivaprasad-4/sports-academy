import React, { useEffect, useState } from 'react';
import { reportService } from '../services';
import { X, Printer, CheckCircle2, Loader2, Download, Building2, User, Calendar, CreditCard, Receipt } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, paymentId }) => {
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && paymentId) {
            loadReceipt();
        }
    }, [isOpen, paymentId]);

    const loadReceipt = async () => {
        try {
            setLoading(true);
            const data = await reportService.getReceipt(paymentId);
            setReceipt(data);
        } catch (error) {
            console.error('Failed to load receipt:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header - Not printed */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-xl text-primary-600">
                            <Receipt size={20} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Payment Receipt</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrint}
                            className="btn bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2 px-4"
                        >
                            <Printer size={18} /> Print Receipt
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Receipt Content - Printed area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 print:p-0 print:overflow-visible overflow-x-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary-600" size={40} />
                            <p className="text-gray-500 font-bold animate-pulse">Generating Secure Receipt...</p>
                        </div>
                    ) : receipt ? (
                        <div id="printable-receipt" className="space-y-10 selection:bg-primary-100">
                            {/* Branding & Receipt No */}
                            <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{receipt.academy_name}</h1>
                                    <p className="text-sm font-bold text-gray-500 mt-1">Official Payment Acknowledgement</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receipt Number</div>
                                    <div className="text-lg font-mono font-bold text-primary-600">{receipt.receipt_no}</div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <User size={12} /> Billed To
                                        </div>
                                        <div className="text-lg font-black text-gray-900">{receipt.athlete_name}</div>
                                        <div className="text-sm font-medium text-gray-500">Athlete ID: #{receipt.athlete_id}</div>
                                        <div className="text-sm font-bold text-gray-600 mt-1">{receipt.batch_name} • {receipt.sport_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <CreditCard size={12} /> Payment Info
                                        </div>
                                        <div className="text-sm font-bold text-gray-700">Method: {receipt.payment_method}</div>
                                        <div className="text-xs font-mono text-gray-400 mt-1">Ref: {receipt.razorpay_payment_id || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="space-y-6 text-right md:text-left">
                                    <div className="md:ml-auto md:w-fit">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1 md:justify-end">
                                            <Calendar size={12} /> Transaction Date
                                        </div>
                                        <div className="text-lg font-black text-gray-900">
                                            {new Date(receipt.transaction_date).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm font-medium text-gray-500">
                                            {new Date(receipt.transaction_date).toLocaleTimeString('en-IN', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                    <div className="md:ml-auto md:w-fit">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1 md:justify-end">
                                            <CheckCircle2 size={12} className="text-emerald-500" /> Status
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {receipt.payment_status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr>
                                            <td className="px-6 py-6 font-bold text-gray-800">
                                                {receipt.fee_description}
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Sports Training & Facility Usage Fee</p>
                                            </td>
                                            <td className="px-6 py-6 text-right font-black text-xl text-gray-900">
                                                ₹{parseFloat(receipt.amount_paid).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot className="bg-gray-900 text-white">
                                        <tr>
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs">Final Net Amount</td>
                                            <td className="px-6 py-4 text-right font-black text-2xl tracking-tighter">
                                                ₹{parseFloat(receipt.amount_paid).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Seal & Footer */}
                            <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-dashed border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center p-2 opacity-60">
                                        <div className="w-full h-full rounded-full border-2 border-emerald-500/50 flex items-center justify-center text-[8px] font-black text-emerald-600 text-center uppercase leading-none">
                                            Digital<br/>Seal
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold max-w-[200px] leading-relaxed">
                                        This is a computer-generated document and does not require a physical signature. Verified by Sports Academy Billing Team.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-gray-900 italic tracking-tighter opacity-20">Thank You</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400 font-bold">Failed to load receipt data.</div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #printable-receipt, #printable-receipt * { visibility: visible !important; }
                    #printable-receipt { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
};

// Receipt import confirmed above

