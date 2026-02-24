import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import DenominationInput from './DenominationInput';
import VoiceInput from './VoiceInput';

const MoiEntryForm = ({ onSubmit, initialData = null }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        location: initialData?.location || '',
        amount: initialData?.amount || '',
        notes: initialData?.notes || '',
        denominations: initialData?.denominations || {}
    });

    const [useDenomination, setUseDenomination] = useState(false);
    const [denominationValid, setDenominationValid] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Strict validation for amount field
        if (name === 'amount') {
            // Allow empty string to let user clear input
            if (value === '') {
                if (useDenomination) {
                    setUseDenomination(false);
                    setDenominationValid(false);
                    setFormData(prev => ({ ...prev, amount: '', denominations: {} }));
                } else {
                    setFormData(prev => ({ ...prev, amount: '' }));
                }
                setErrors(prev => ({ ...prev, amount: '' }));
                return;
            }

            // Check for decimals or non-digits
            if (/[^0-9]/.test(value)) {
                setErrors(prev => ({ ...prev, amount: 'Only whole numbers are allowed' }));
                return; // Block update
            }

            // Remove leading zeros
            const sanitizedValue = value.replace(/^0+/, '');

            if (useDenomination) {
                setUseDenomination(false);
                setDenominationValid(false);
                setFormData(prev => ({
                    ...prev,
                    amount: sanitizedValue,
                    denominations: {}
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    amount: sanitizedValue
                }));
            }

            // Clear error if valid
            setErrors(prev => ({ ...prev, amount: '' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAmountConfirm = () => {
        // Open denomination only when amount is confirmed (Enter or Blur)
        if (formData.amount && parseFloat(formData.amount) > 0) {
            setUseDenomination(true);
        }
    };

    const handleAmountKeyDown = (e) => {
        // Handle Enter key
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAmountConfirm();
            return;
        }

        // Prevent decimal point, comma, e, +, -
        if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
            setErrors(prev => ({ ...prev, amount: 'Only whole numbers are allowed' }));
        }
    };

    const handleCloseDenomination = () => {
        setUseDenomination(false);
        setDenominationValid(false);
        // Reset denominations
        setFormData(prev => ({
            ...prev,
            denominations: {}
        }));
    };

    const handleDenominationChange = (total, denominations, isValid, exceeds) => {
        // Don't overwrite the amount - only update denominations
        setFormData(prev => ({
            ...prev,
            denominations
        }));
        setDenominationValid(isValid);
    };

    const handleVoiceTranscript = (field, transcript) => {
        setFormData(prev => ({
            ...prev,
            [field]: transcript
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.amount || formData.amount <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        // Check denomination validation if using denomination input
        if (useDenomination && !denominationValid) {
            newErrors.amount = 'Denomination total must exactly match the entered amount';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate integer amount
        if (!/^\d+$/.test(formData.amount)) {
            setErrors(prev => ({ ...prev, amount: 'Amount must be a whole number' }));
            return;
        }

        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        // Check denomination validation if using denomination input
        if (useDenomination && !denominationValid) {
            newErrors.amount = 'Denomination total must exactly match the entered amount';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Create clean form data with integer amount as NUMBER
        const dataToSubmit = {
            ...formData,
            amount: parseInt(formData.amount, 10), // Send as number, not string
            denominations: useDenomination ? formData.denominations : null
        };

        if (onSubmit) {
            onSubmit(dataToSubmit);

            // Reset form if submission successful
            setFormData({
                name: '',
                location: '',
                amount: '',
                notes: '',
                denominations: {}
            });
            setUseDenomination(false);
            setDenominationValid(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: '',
            location: '',
            amount: '',
            notes: '',
            denominations: {}
        });
        setErrors({});
        setUseDenomination(false);
        setDenominationValid(false);
    };

    return (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-xl border-2 border-transparent bg-clip-padding p-6 md:p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            {/* CSS to hide spinners */}
            <style jsx>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {/* Gradient Border Effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 opacity-50 -z-10"></div>

            {/* Header with Icon */}
            <div className="flex items-start gap-4 mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {t.addNewEntry}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Track contributions easily</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                {/* Name Field with Voice Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.name} *
                    </label>
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder={t.namePlaceholder}
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>
                        <VoiceInput
                            fieldName="Name"
                            onTranscript={(transcript) => handleVoiceTranscript('name', transcript)}
                        />
                    </div>
                </div>

                {/* Location Field with Voice Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.location} *
                    </label>
                    <div className="flex items-start gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder={t.locationPlaceholder}
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>
                        <VoiceInput
                            fieldName="Location"
                            onTranscript={(transcript) => handleVoiceTranscript('location', transcript)}
                        />
                    </div>
                </div>

                {/* Amount Input - Controlled opening with Enter/Blur */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.amount} *
                    </label>

                    {!useDenomination ? (
                        <>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleInputChange}
                                onBlur={handleAmountConfirm}
                                onKeyDown={handleAmountKeyDown}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min="1"
                                step="1"
                                className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 ${errors.amount ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                                    }`}
                                placeholder={t.amountPlaceholder}
                            />
                            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> or click outside to open denomination breakdown
                            </p>
                        </>
                    ) : (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Target Amount</p>
                                    <p className="text-2xl font-bold text-blue-700">₹{parseFloat(formData.amount).toLocaleString()}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseDenomination}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all duration-200"
                                >
                                    Change Amount
                                </button>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                ⚠️ Changing amount will reset denomination breakdown
                            </p>
                        </div>
                    )}
                </div>

                {/* Denomination Input - Mandatory when amount is entered */}
                {useDenomination && (
                    <DenominationInput
                        onTotalChange={handleDenominationChange}
                        initialDenominations={formData.denominations}
                        targetAmount={formData.amount}
                        onClose={handleCloseDenomination}
                    />
                )}


                {/* Notes Field */}
                <div>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.notesPlaceholder}
                    />
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={useDenomination && !denominationValid}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-base md:text-lg shadow-lg ${useDenomination && !denominationValid
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 hover:shadow-xl active:scale-95'
                            }`}
                    >
                        ✓ {t.addEntry}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        Reset
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MoiEntryForm;
