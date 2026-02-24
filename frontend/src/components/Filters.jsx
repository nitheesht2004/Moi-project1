import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const Filters = ({
    search,
    onSearchChange,
    locationFilter,
    onLocationChange,
    minAmount,
    onMinAmountChange,
    maxAmount,
    onMaxAmountChange,
    sortBy,
    sortOrder,
    onSortChange,
    onClearFilters
}) => {
    const { language } = useLanguage();
    const t = translations[language];
    const [isClearing, setIsClearing] = useState(false);

    const handleClearFilters = () => {
        setIsClearing(true);
        setTimeout(() => {
            onClearFilters();
            setIsClearing(false);
        }, 300);
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) {
            return (
                <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortOrder === 'asc' ? (
            <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    return (
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl border border-white/50 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t.filters}
                    </h3>
                </div>
                <button
                    onClick={handleClearFilters}
                    className={`text-xs md:text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-full hover:bg-red-50 transition-all duration-300 hover:scale-105 active:scale-95 ${isClearing ? 'animate-shake' : ''}`}
                >
                    ✕ {t.clearFilters}
                </button>
            </div>

            {/* Search and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                {/* Search Input */}
                <div className="relative group">
                    <input
                        type="text"
                        id="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    />
                    <label
                        htmlFor="search"
                        className="absolute left-4 top-3 text-gray-500 text-sm md:text-base transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                        🔍 {t.searchByName}
                    </label>
                </div>

                {/* Location Input */}
                <div className="relative group">
                    <input
                        type="text"
                        id="location"
                        value={locationFilter}
                        onChange={(e) => onLocationChange(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    />
                    <label
                        htmlFor="location"
                        className="absolute left-4 top-3 text-gray-500 text-sm md:text-base transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                        📍 {t.location}
                    </label>
                </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                {/* Min Amount */}
                <div className="relative group">
                    <input
                        type="number"
                        id="minAmount"
                        value={minAmount}
                        onChange={(e) => onMinAmountChange(e.target.value)}
                        placeholder=" "
                        min="0"
                        className="peer w-full px-4 py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    />
                    <label
                        htmlFor="minAmount"
                        className="absolute left-4 top-3 text-gray-500 text-sm md:text-base transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-green-600 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                        💰 {t.minAmount}
                    </label>
                </div>

                {/* Max Amount */}
                <div className="relative group">
                    <input
                        type="number"
                        id="maxAmount"
                        value={maxAmount}
                        onChange={(e) => onMaxAmountChange(e.target.value)}
                        placeholder=" "
                        min="0"
                        className="peer w-full px-4 py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    />
                    <label
                        htmlFor="maxAmount"
                        className="absolute left-4 top-3 text-gray-500 text-sm md:text-base transition-all duration-300 pointer-events-none peer-focus:top-[-10px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-green-600 peer-focus:bg-white peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-2"
                    >
                        💵 {t.maxAmount}
                    </label>
                </div>
            </div>

            {/* Sort Options */}
            <div className="border-t-2 border-gray-100 pt-6">
                <label className="block text-sm md:text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    {t.sortBy}
                </label>
                <div className="flex flex-wrap gap-3">
                    {/* Amount Sort */}
                    <button
                        onClick={() => onSortChange('amount')}
                        className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 text-sm md:text-base flex items-center gap-2 hover:scale-105 active:scale-95 ${sortBy === 'amount'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                            }`}
                    >
                        💰 {t.sortByAmount}
                        {getSortIcon('amount')}
                    </button>

                    {/* Name Sort */}
                    <button
                        onClick={() => onSortChange('name')}
                        className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 text-sm md:text-base flex items-center gap-2 hover:scale-105 active:scale-95 ${sortBy === 'name'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                            }`}
                    >
                        👤 {t.sortByName}
                        {getSortIcon('name')}
                    </button>

                    {/* Location Sort */}
                    <button
                        onClick={() => onSortChange('location')}
                        className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 text-sm md:text-base flex items-center gap-2 hover:scale-105 active:scale-95 ${sortBy === 'location'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                            }`}
                    >
                        📍 {t.sortByLocation}
                        {getSortIcon('location')}
                    </button>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }

                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Filters;
