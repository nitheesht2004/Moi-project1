import React, { useState, useEffect } from 'react';

const DenominationInput = ({ onTotalChange, initialDenominations = {}, targetAmount = 0, onClose }) => {
    const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];

    const [counts, setCounts] = useState(
        denominations.reduce((acc, denom) => {
            acc[denom] = initialDenominations[denom] || '';
            return acc;
        }, {})
    );

    const [total, setTotal] = useState(0);
    const [animatedTotal, setAnimatedTotal] = useState(0);
    const [animatedRemaining, setAnimatedRemaining] = useState(0);

    // Animate counter changes
    useEffect(() => {
        const duration = 300;
        const steps = 20;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const startTotal = animatedTotal;
        const endTotal = total;
        const totalDiff = endTotal - startTotal;

        const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                const progress = currentStep / steps;
                const easeProgress = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                setAnimatedTotal(Math.round(startTotal + totalDiff * easeProgress));
            } else {
                setAnimatedTotal(endTotal);
                clearInterval(interval);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [total]);

    useEffect(() => {
        const target = parseFloat(targetAmount) || 0;
        const remaining = target - total;

        const duration = 300;
        const steps = 20;
        const stepDuration = duration / steps;

        let currentStep = 0;
        const startRemaining = animatedRemaining;
        const endRemaining = remaining;
        const remainingDiff = endRemaining - startRemaining;

        const interval = setInterval(() => {
            currentStep++;
            if (currentStep <= steps) {
                const progress = currentStep / steps;
                const easeProgress = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                setAnimatedRemaining(Math.round(startRemaining + remainingDiff * easeProgress));
            } else {
                setAnimatedRemaining(endRemaining);
                clearInterval(interval);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [total, targetAmount]);

    useEffect(() => {
        const calculatedTotal = denominations.reduce((sum, denom) => {
            return sum + (denom * (counts[denom] || 0));
        }, 0);
        setTotal(calculatedTotal);

        // Notify parent with total and validation status
        if (onTotalChange) {
            const isValid = calculatedTotal === parseFloat(targetAmount);
            const exceeds = calculatedTotal > parseFloat(targetAmount);
            onTotalChange(calculatedTotal, counts, isValid, exceeds);
        }
    }, [counts, targetAmount]);

    const handleCountChange = (denom, value) => {
        // Allow empty string or valid positive numbers
        if (value === '') {
            setCounts(prev => ({
                ...prev,
                [denom]: ''
            }));
        } else {
            const numValue = parseInt(value) || 0;
            setCounts(prev => ({
                ...prev,
                [denom]: numValue >= 0 ? numValue : ''
            }));
        }
    };

    const handleClear = () => {
        setCounts(denominations.reduce((acc, denom) => {
            acc[denom] = '';
            return acc;
        }, {}));
    };

    const target = parseFloat(targetAmount) || 0;
    const remaining = target - total;
    const exceeds = total > target;
    const matches = total === target && target > 0;
    const partial = total > 0 && total < target;
    const inputsDisabled = exceeds;

    // Determine status color
    const getStatusColor = () => {
        if (exceeds) return 'red';
        if (matches) return 'green';
        if (partial) return 'yellow';
        return 'gray';
    };

    const statusColor = getStatusColor();

    return (
        <div className="animate-slideDown">
            {/* Desktop Container with Max Width */}
            <div className="max-w-full lg:max-w-[460px] mx-auto">
                <div className="bg-gradient-to-br from-white via-purple-50/20 to-blue-50/30 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-purple-100/50 transition-all duration-300 hover:shadow-3xl">
                    {/* Header - Mobile Responsive */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        {/* Left: Icon + Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Denomination Breakdown
                            </h3>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Clear All Button - Hidden on very small screens, shown on sm+ */}
                            <button
                                onClick={handleClear}
                                className="hidden sm:flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                                aria-label="Clear all denominations"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Clear All</span>
                            </button>

                            {/* Clear All Icon Only - Shown only on extra small screens */}
                            <button
                                onClick={handleClear}
                                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 active:bg-red-100 transition-all duration-200 active:scale-95 group"
                                aria-label="Clear all denominations"
                            >
                                <svg className="w-5 h-5 text-red-600 group-hover:text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            {/* Close Button - Always visible, touch-friendly */}
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 hover:scale-110 active:scale-95 group flex-shrink-0"
                                    aria-label="Close denomination panel"
                                    title="Close"
                                >
                                    <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 group-hover:rotate-90 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Dashboard */}
                    <div className="mb-6 p-5 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg border-2 border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Entered Amount */}
                            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
                                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Target Amount</p>
                                <p className="text-2xl md:text-3xl font-bold text-blue-700">₹{target.toLocaleString()}</p>
                            </div>

                            {/* Denomination Total */}
                            <div className={`text-center p-4 rounded-lg transition-all duration-300 ${statusColor === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100/50 animate-pulse' :
                                statusColor === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100/50' :
                                    statusColor === 'yellow' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100/50' :
                                        'bg-gradient-to-br from-gray-50 to-gray-100/50'
                                }`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${statusColor === 'red' ? 'text-red-600' :
                                    statusColor === 'green' ? 'text-green-600' :
                                        statusColor === 'yellow' ? 'text-yellow-600' :
                                            'text-gray-600'
                                    }`}>Current Total</p>
                                <p className={`text-2xl md:text-3xl font-bold transition-all duration-300 ${statusColor === 'red' ? 'text-red-700' :
                                    statusColor === 'green' ? 'text-green-700' :
                                        statusColor === 'yellow' ? 'text-yellow-700' :
                                            'text-gray-700'
                                    }`}>₹{animatedTotal.toLocaleString()}</p>
                            </div>

                            {/* Remaining */}
                            <div className={`text-center p-4 rounded-lg transition-all duration-300 ${remaining < 0 ? 'bg-gradient-to-br from-red-50 to-red-100/50' :
                                remaining === 0 ? 'bg-gradient-to-br from-green-50 to-green-100/50' :
                                    'bg-gradient-to-br from-orange-50 to-orange-100/50'
                                }`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${remaining < 0 ? 'text-red-600' :
                                    remaining === 0 ? 'text-green-600' :
                                        'text-orange-600'
                                    }`}>Remaining</p>
                                <p className={`text-2xl md:text-3xl font-bold ${remaining < 0 ? 'text-red-700' :
                                    remaining === 0 ? 'text-green-700' :
                                        'text-orange-700'
                                    }`}>
                                    ₹{Math.abs(animatedRemaining).toLocaleString()}
                                    {remaining < 0 && <span className="text-sm ml-1">(Over)</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Validation Messages */}
                    {exceeds && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-r-xl shadow-lg animate-shake flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                                <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>⚠️ Denomination exceeds target - All inputs disabled</span>
                            </p>
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reset Denomination
                            </button>
                        </div>
                    )}

                    {partial && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-r-xl shadow-lg">
                            <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                ⚡ Add ₹{remaining.toLocaleString()} more to match the target amount
                            </p>
                        </div>
                    )}

                    {matches && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-r-xl shadow-lg">
                            <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                ✓ Perfect! Denomination matches amount exactly
                            </p>
                        </div>
                    )}

                    {/* Denomination Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                        {denominations.map(denom => {
                            const currentCount = parseInt(counts[denom]) || 0;
                            const currentValue = denom * currentCount;
                            const canAfford = denom <= remaining || currentCount > 0;
                            const isExactMatch = denom === remaining && remaining > 0;
                            const isDenomDisabled = exceeds || (!canAfford && currentCount === 0);

                            return (
                                <div
                                    key={denom}
                                    className={`group relative bg-white rounded-xl shadow-md transition-all duration-300 overflow-hidden ${isDenomDisabled
                                        ? 'opacity-40 cursor-not-allowed'
                                        : isExactMatch
                                            ? 'ring-2 ring-green-400 shadow-xl scale-105 animate-pulse'
                                            : 'hover:shadow-xl hover:scale-105'
                                        }`}
                                >
                                    {/* Exact Match Indicator */}
                                    {isExactMatch && (
                                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold py-1 px-2 text-center">
                                            ✓ Perfect Match!
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className={`p-3 text-center transition-colors duration-300 ${isDenomDisabled
                                        ? 'bg-gray-300'
                                        : isExactMatch
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                            : 'bg-gradient-to-br from-purple-500 to-blue-600'
                                        }`}>
                                        <p className="text-white font-bold text-lg">₹{denom}</p>
                                    </div>

                                    {/* Card Body */}
                                    <div className={`p-3 ${isExactMatch ? 'pt-6' : ''}`}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={counts[denom]}
                                            onChange={(e) => handleCountChange(denom, e.target.value)}
                                            disabled={isDenomDisabled}
                                            className={`w-full h-12 px-2 text-center text-xl md:text-2xl font-bold border-2 rounded-lg transition-all duration-300 outline-none appearance-none ${isDenomDisabled
                                                ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400'
                                                : isExactMatch
                                                    ? 'border-green-400 text-green-700 bg-green-50 shadow-inner'
                                                    : 'border-purple-200 text-gray-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-white hover:border-purple-300'
                                                }`}
                                            placeholder="0"
                                        />
                                        <p className={`text-center text-xs font-medium mt-2 transition-colors duration-300 ${isDenomDisabled ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            = ₹{(denom * (parseInt(counts[denom]) || 0)).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Glow effect on active cards */}
                                    {!isDenomDisabled && (
                                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${isExactMatch
                                            ? 'bg-gradient-to-br from-green-400/20 to-emerald-400/20'
                                            : 'bg-gradient-to-br from-purple-400/10 to-blue-400/10'
                                            }`}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Helper Message for Exact Match */}
                    {remaining > 0 && !exceeds && denominations.includes(remaining) && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-xl shadow-lg animate-slideDown">
                            <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                💡 Add ₹{remaining.toLocaleString()} more to match the target amount exactly!
                            </p>
                        </div>
                    )}

                    {/* Total Display */}
                    <div className="border-t-2 border-purple-100 pt-6">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                            <span className="text-lg md:text-xl font-bold text-gray-800">Grand Total:</span>
                            <span className={`text-3xl md:text-4xl font-bold transition-all duration-300 ${statusColor === 'red' ? 'text-red-600' :
                                statusColor === 'green' ? 'text-green-600' :
                                    statusColor === 'yellow' ? 'text-yellow-600' :
                                        'text-gray-600'
                                }`}>
                                ₹{animatedTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Custom CSS for animations */}
                <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                .animate-slideDown {
                    animation: slideDown 0.5s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .shadow-3xl {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                /* Hide spinners in number input */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            </div>
        </div>
    );
};

export default DenominationInput;
