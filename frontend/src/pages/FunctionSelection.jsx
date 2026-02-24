import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import { eventService } from '../services/eventService';
import { toast } from 'react-toastify';

const FunctionSelection = () => {
    const { user, logout } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];
    const navigate = useNavigate();
    const [functions, setFunctions] = useState([]);
    const [showNewFunctionForm, setShowNewFunctionForm] = useState(false);
    const [newFunctionName, setNewFunctionName] = useState('');

    useEffect(() => {
        // ✅ Load events from backend API
        const loadEvents = async () => {
            try {
                const events = await eventService.getAll();
                setFunctions(events);
                // Cache in localStorage for offline access
                localStorage.setItem('moi_functions', JSON.stringify(events));
            } catch (error) {
                console.error('Failed to load events from API:', error);
                // Fallback to localStorage if API fails
                const cachedFunctions = JSON.parse(localStorage.getItem('moi_functions') || '[]');
                setFunctions(cachedFunctions);
            }
        };

        loadEvents();
    }, []);

    const handleCreateFunction = async (e) => {
        e.preventDefault();

        const trimmedName = newFunctionName.trim();

        // Validate name
        if (!trimmedName) {
            toast.error(t.eventNameRequired);
            return;
        }

        if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
            toast.error(t.onlyTextAllowed);
            return;
        }

        // Check uniqueness
        if (functions.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
            toast.error(t.eventAlreadyExists);
            return;
        }

        try {
            // ✅ Call backend API to create event (database generates ID)
            const createdEvent = await eventService.create({ name: trimmedName });

            // Update local state with backend-generated event (includes real DB ID)
            const updatedFunctions = [...functions, createdEvent];
            localStorage.setItem('moi_functions', JSON.stringify(updatedFunctions));
            setFunctions(updatedFunctions);

            // Set active and redirect
            handleSelectFunction(createdEvent);
            toast.success(t.eventCreatedSuccess || 'Event created successfully');
        } catch (error) {
            console.error('Create event error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to create event';
            toast.error(errorMessage);
        }
    };

    const handleSelectFunction = (func) => {
        localStorage.setItem('moi_active_function', JSON.stringify(func));
        toast.success(`${t.activeEvent}: ${func.name}`);
        // Pass event data via router state to prevent race condition with localStorage
        navigate('/dashboard', { state: { activeFunction: func } });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleDeleteEvent = async (eventToDelete, e) => {
        e.stopPropagation(); // Prevent event selection when clicking delete

        if (window.confirm(t.deleteEventConfirm)) {
            try {
                const result = await eventService.delete(eventToDelete.id);

                if (result.success) {
                    toast.success(t.eventDeletedSuccess);

                    // Remove from localStorage
                    const updatedFunctions = functions.filter(f => f.id !== eventToDelete.id);
                    localStorage.setItem('moi_functions', JSON.stringify(updatedFunctions));
                    setFunctions(updatedFunctions);

                    // Clear active function if it was deleted
                    const activeFunc = localStorage.getItem('moi_active_function');
                    if (activeFunc) {
                        const parsedActive = JSON.parse(activeFunc);
                        if (parsedActive.id === eventToDelete.id) {
                            localStorage.removeItem('moi_active_function');
                        }
                    }
                } else {
                    toast.error(result.message || t.failedToDeleteEvent);
                }
            } catch (error) {
                console.error('Delete event error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to delete event';
                toast.error(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 md:mb-12 container mx-auto max-w-5xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{t.moiPanamManager}</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                    {t.logout}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center container mx-auto max-w-5xl animate-fade-in-up">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t.chooseYourEvent}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600">
                        {t.startNewOrContinue}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    {/* Option 1: New Function */}
                    <div
                        className={`bg-white rounded-3xl shadow-xl border-2 border-transparent p-8 md:p-12 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden ${showNewFunctionForm ? 'ring-4 ring-blue-100 border-blue-200' : 'hover:border-blue-100'}`}
                        onClick={() => !showNewFunctionForm && setShowNewFunctionForm(true)}
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </div>

                        {!showNewFunctionForm ? (
                            <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
                                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:bg-blue-600 transition-colors">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.newEvent}</h3>
                                <p className="text-gray-500">{t.createNewEvent}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateFunction} onClick={e => e.stopPropagation()} className="relative z-10 h-full flex flex-col justify-center animate-fade-in">
                                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{t.nameYourEvent}</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFunctionName}
                                    onChange={e => setNewFunctionName(e.target.value)}
                                    placeholder={t.eventPlaceholder}
                                    className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none mb-4 text-center"
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowNewFunctionForm(false)}
                                        className="flex-1 px-4 py-3 text-gray-600 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all"
                                    >
                                        {t.create}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Option 2: Continue Function */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{t.continueExisting}</h3>
                                <p className="text-sm text-gray-500">{t.pickUpWhereLeft}</p>
                            </div>
                        </div>

                        {functions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <span className="mb-2 text-4xl">📂</span>
                                <p>No existing events found</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                {functions.map(func => (
                                    <div
                                        key={func.id}
                                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-purple-200 bg-white hover:bg-purple-50 transition-all group shadow-sm hover:shadow-md flex items-center justify-between"
                                    >
                                        <button
                                            onClick={() => handleSelectFunction(func)}
                                            className="flex-1 text-left"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700 group-hover:text-purple-700">{func.name}</span>
                                                <span className="text-gray-300 group-hover:text-purple-400">→</span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(func.createdAt).toLocaleDateString()}
                                            </span>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDeleteEvent(func, e)}
                                            className="ml-3 p-2 rounded-lg hover:bg-red-50 transition-colors group/delete"
                                            aria-label="Delete event"
                                        >
                                            <svg className="w-5 h-5 text-gray-400 group-hover/delete:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FunctionSelection;
