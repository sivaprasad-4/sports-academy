import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Building2, Wallet, CheckCircle2, ArrowRight, Smartphone as Phone } from 'lucide-react';

export const RazorpayMockModal = ({ isOpen, onClose, order, fee, onPaymentSuccess }) => {
    const [step, setStep] = useState('methods'); // 'methods', 'upi_apps', 'upi_qr', 'redirecting', 'processing', 'success'
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isMobile] = useState(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    const [copied, setCopied] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Waiting for payment confirmation...');
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        let timers = [];
        let pollingInterval;

        const checkStatus = async () => {
            try {
                if (!order?.order_id) return;
                const token = localStorage.getItem('access_token');

                // Call fetch-and-sync which auto-confirms mock orders in DEBUG mode
                // and queries Razorpay API directly for real orders
                const response = await fetch('/api/payments/fetch-and-sync/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ order_id: order.order_id })
                });
                const data = await response.json();

                if (data.status === 'SUCCESS' || data.status === 'FAILED') {
                    if (pollingInterval) clearInterval(pollingInterval);
                    if (data.status === 'SUCCESS') {
                        simulatePayment();
                    } else {
                        setStatusMessage('Payment failed or cancelled.');
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };


        if (step === 'upi_qr' || step === 'redirecting' || step === 'processing') {
            setStatusMessage('Waiting for payment confirmation...');
            if (step === 'upi_qr') setShowFallback(false);

            // Poll every 10 seconds to give user time to scan and pay
            pollingInterval = setInterval(checkStatus, 10000);
            
            // Show the manual "Verify" button after 10 seconds as a fallback
            const t = setTimeout(() => {
                setShowFallback(true);
            }, 10000);
            timers.push(t);

            return () => {
                timers.forEach(t => clearTimeout(t));
                if (pollingInterval) clearInterval(pollingInterval);
            };
        }
    }, [step, order?.order_id]);


    const handleCopyUpi = () => {
        const upiId = order.academy_upi_id || 'sportsacademy@upi';
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
        if (method === 'upi') {
            setStep('upi_apps');
        } else {
            // For other methods in this mock, we still show the processing screen
            // but we won't automatically succeed unless some "simulated action" happens.
            // For simplicity, we'll just move to a generic "processing" step.
            setStep('processing');
            // Adding a manual button to "Complete" the mock payment for non-UPI
            setTimeout(() => {
                setStatusMessage('Simulating external payment gateway...');
                setShowFallback(true);
            }, 2000);
        }
    };

    const handleAppSelect = (app) => {
        setSelectedApp(app);
        
        const upiId = order.academy_upi_id || 'sportsacademy@upi';
        const amount = (order.amount / 100).toFixed(2);
        const description = (fee?.description || 'Training Fee').substring(0, 50); // Limit length
        const txnRef = `REF${order.order_id.replace('order_', '')}`;
        const payeeName = encodeURIComponent('Sports Academy');
        const note = encodeURIComponent(description);
        
        // Added tr (transaction ref) and mc (merchant code) for better compatibility
        const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}&tr=${txnRef}&mc=0000`;

        if (isMobile) {
            setStep('redirecting');
            window.location.href = upiLink;
            setTimeout(() => setShowFallback(true), 3000);
        } else {
            setStep('upi_qr');
        }
    };

    const handleConfirmPayment = async () => {
        setStatusMessage('Verifying with Razorpay...');
        try {
            if (!order?.order_id) return;
            const token = localStorage.getItem('access_token');
            
            // Call the fetch-and-sync endpoint that actively queries Razorpay's API
            const response = await fetch('/api/payments/fetch-and-sync/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ order_id: order.order_id })
            });
            const data = await response.json();
            
            if (data.status === 'SUCCESS') {
                simulatePayment();
            } else {
                setStatusMessage('Payment not detected. Please try again');
                setTimeout(() => setStatusMessage('Waiting for payment confirmation...'), 3000);
            }
        } catch (err) {
            console.error("Verification error:", err);
            setStatusMessage('Error verifying payment. Please try again.');
        }
    };


    const simulatePayment = () => {
        setStep('processing');
        // Transition to success screen after a brief delay
        // No longer generates a mock_signature to call the verify API.
        // Instead, it confirms the backend has already reached SUCCESS state.
        setTimeout(() => {
            setStep('success');
            // Success screen delay (2 seconds) before closing
            setTimeout(() => {
                onPaymentSuccess(); // Signal completion without a fake signature
                onClose();
            }, 2000);
        }, 3500);
    };

    const paymentMethods = [
        { id: 'upi', icon: <Phone className="text-blue-600" />, label: 'UPI', desc: 'Google Pay, PhonePe, Paytm & more' },
        { id: 'card', icon: <CreditCard className="text-purple-600" />, label: 'Card', desc: 'Visa, Master Card, RuPay' },
        { id: 'netbanking', icon: <Building2 className="text-orange-600" />, label: 'Netbanking', desc: 'All Indian Banks' },
        { id: 'wallet', icon: <Wallet className="text-green-600" />, label: 'Wallet', desc: 'Mobikwik, Freecharge & more' },
    ];

    const upiId = order?.academy_upi_id || 'sportsacademy@upi';
    const amount = ((order?.amount || 0) / 100).toFixed(2);
    const description = (fee?.description || 'Training Fee').substring(0, 50);
    const txnRef = order?.order_id ? `REF${order.order_id.replace('order_', '')}` : `REF${Date.now()}`;
    
    // Encode components to handle special characters (&, =, ?) within the UPI link
    const encodedPayee = encodeURIComponent('Sports Academy');
    const encodedNote = encodeURIComponent(description);
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}&tr=${txnRef}&mc=0000`;
    
    // Encode the entire link for the QR API (using quickchart.io for better reliability)
    const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiLink)}&size=300`;

    const upiApps = [
        { id: 'gpay', name: 'Google Pay', color: 'bg-blue-50' },
        { id: 'phonepe', name: 'PhonePe', color: 'bg-purple-50' },
        { id: 'paytm', name: 'Paytm', color: 'bg-sky-50' },
        { id: 'bhim', name: 'BHIM', color: 'bg-orange-50' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">
                            S
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight text-white border-none">Sports Academy</h3>
                            <p className="text-slate-400 text-xs">{fee?.description || 'Training Fee'}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-2xl font-bold italic">₹{(order.amount / 100).toFixed(2)}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 min-h-[350px]">
                    {step === 'methods' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Payment Method</h4>
                            {paymentMethods.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleMethodSelect(m.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">
                                        {m.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-gray-900">{m.label}</div>
                                        <div className="text-xs text-gray-500">{m.desc}</div>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 'upi_apps' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <div className="flex items-center gap-2 mb-4">
                                <button 
                                    onClick={() => setStep('methods')}
                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                                >
                                    <ArrowRight size={18} className="rotate-180" />
                                </button>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select UPI App</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {upiApps.map((app) => (
                                    <button
                                        key={app.id}
                                        onClick={() => handleAppSelect(app)}
                                        className={`p-4 rounded-xl border border-transparent ${app.color} hover:shadow-md transition-all flex flex-col items-center gap-2 text-gray-900 font-bold`}
                                    >
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600">
                                            <Phone size={24} />
                                        </div>
                                        {app.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 'upi_qr' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="flex items-center gap-2 mb-2">
                                <button 
                                    onClick={() => setStep('upi_apps')}
                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                                >
                                    <ArrowRight size={18} className="rotate-180" />
                                </button>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Scan & Pay</h4>
                            </div>
                            
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl shadow-sm hover:border-blue-400 transition-colors relative min-h-[200px] flex items-center justify-center">
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="Scan QR to Pay" 
                                        className="w-48 h-48 block mx-auto"
                                        onError={(e) => {
                                            console.error("QR Code failed to load");
                                            setStatusMessage("QR Code generation failed. Please use UPI ID.");
                                        }}
                                    />
                                </div>
                                
                                <div className="text-center space-y-3">
                                    <p className="text-sm font-bold text-gray-700">Scan QR and complete payment in your UPI app</p>
                                    
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                            <code className="text-[10px] font-mono text-gray-600">{order.academy_upi_id || 'sportsacademy@upi'}</code>
                                            <button 
                                                onClick={handleCopyUpi}
                                                className="p-1 hover:bg-gray-200 rounded transition-colors text-blue-600"
                                                title="Copy UPI ID"
                                            >
                                                {copied ? <CheckCircle2 size={14} className="text-green-600" /> : <Smartphone size={14} />}
                                            </button>
                                        </div>
                                        {copied && <span className="text-[10px] text-green-600 font-medium">UPI ID Copied!</span>}
                                    </div>

                                    <div className="flex items-center justify-center gap-3 py-2 bg-slate-50 rounded-xl px-4 border border-slate-100">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{statusMessage}</p>
                                    </div>

                                    {showFallback && (
                                        <button 
                                            onClick={handleConfirmPayment}
                                            className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all animate-bounce"
                                        >
                                            Verify Payment Completion
                                        </button>
                                    )}

                                    <p className="text-[10px] text-gray-400 mt-2 italic text-center px-8">
                                        Scan and enter your PIN on your mobile app. Do not close this window.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'redirecting' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 py-12">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                                <Phone size={32} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-gray-900 text-lg">
                                    {isMobile ? `Opening ${selectedApp?.name}...` : 'Processing Request...'}
                                </h4>
                                <p className="text-gray-500 text-sm px-8">
                                    {isMobile 
                                        ? "Please complete the payment in your app and return here." 
                                        : "Please wait while we verify your transaction status."
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 py-12">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">₹</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-gray-900 text-lg">Processing Payment</h4>
                                <p className="text-gray-500 text-sm">Please do not close the window</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500 py-12">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-gray-900 text-2xl">Payment Success!</h4>
                                <p className="text-gray-500 text-sm">Transferring back to Sports Academy</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 grayscale opacity-50">
                        <span className="text-[10px] font-bold text-gray-400 border-none">Secured by</span>
                        <div className="flex items-center gap-0.5 font-black italic text-gray-600 tracking-tighter">
                            <span className="text-blue-600 text-xs">1</span>
                            <span>Razorpay</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
