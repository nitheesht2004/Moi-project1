import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';
import MoiEntryForm from '../components/MoiEntryForm';
import Filters from '../components/Filters';
import SummaryTable from '../components/SummaryTable';
import { entryService } from '../services/entryService';
import { eventService } from '../services/eventService';
import { exportService } from '../services/exportService';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const t = translations[language];
    const navigate = useNavigate();
    const location = useLocation();
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [activeFunction, setActiveFunction] = useState(null);

    // Centralized filter and sort state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');

    // Debounce search with 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Set active function from router or localStorage
    useEffect(() => {
        const funcFromState = location.state?.activeFunction;
        const funcFromStorage = localStorage.getItem('moi_active_function');
        const func = funcFromState || (funcFromStorage ? JSON.parse(funcFromStorage) : null);

        if (!func) {
            navigate('/functions');
            return;
        }
        setActiveFunction(func);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Single API trigger - only when filters, sort, or eventId changes
    useEffect(() => {
        if (!activeFunction?.id) return;

        const filters = {
            name: debouncedSearch || undefined,
            location: locationFilter || undefined,
            minAmount: minAmount || undefined,
            maxAmount: maxAmount || undefined,
            sortBy,
            sortOrder
        };

        fetchEntries(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, locationFilter, minAmount, maxAmount, sortBy, sortOrder, activeFunction?.id]);

    useEffect(() => {
        // Menu event listeners
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowMenu(false);
            }
        };

        const handleInteraction = () => { if (showMenu) setShowMenu(false); };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleInteraction);
        window.addEventListener('resize', handleInteraction);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('resize', handleInteraction);
        };
    }, [showMenu]);

    const menuButtonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (showMenu && menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 8, // slight offset
                right: window.innerWidth - rect.right
            });
        }
    }, [showMenu]);

    const fetchEntries = async (filters = {}) => {
        try {
            setIsLoading(true);

            if (!activeFunction?.id) {
                console.error('No active function ID');
                return;
            }

            const data = await entryService.getAll(activeFunction.id, filters);
            setEntries(data || []);
        } catch (error) {
            // Don't show error toast for 401 - user will be redirected by ProtectedRoute
            if (error.response?.status !== 401) {
                toast.error(t.failedToFetchEntries);
            }
            console.error('Fetch error:', error);
            setEntries([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEntry = async (formData) => {
        try {
            if (!activeFunction?.id) {
                toast.error(t.noActiveEventSelected);
                return;
            }
            console.log('📤 Sending entry data:', { ...formData, eventId: activeFunction.id });
            await entryService.create(activeFunction.id, formData);
            toast.success(t.entryAddedSuccess);

            // Trigger refetch via state update (useEffect will handle API call)
            const filters = {
                name: debouncedSearch || undefined,
                location: locationFilter || undefined,
                minAmount: minAmount || undefined,
                maxAmount: maxAmount || undefined,
                sortBy,
                sortOrder
            };
            fetchEntries(filters);
        } catch (error) {
            console.error('❌ Add entry error:', error);
            console.error('Error response:', error.response);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to add entry';
            toast.error(errorMessage);
        }
    };

    const handleDeleteEntry = async (id) => {
        if (window.confirm(t.deleteEntryConfirm)) {
            try {
                await entryService.delete(id);
                toast.success(t.entryDeletedSuccess);

                // Trigger refetch via state update
                const filters = {
                    name: debouncedSearch || undefined,
                    location: locationFilter || undefined,
                    minAmount: minAmount || undefined,
                    maxAmount: maxAmount || undefined,
                    sortBy,
                    sortOrder
                };
                fetchEntries(filters);
            } catch (error) {
                toast.error(t.failedToDeleteEntry);
                console.error('Delete error:', error);
            }
        }
    };

    // Sorting handler - only updates state, useEffect handles API call
    const handleSortChange = (field) => {
        if (sortBy === field) {
            // Deselect: clicking the same active button clears the sort
            setSortBy('');
            setSortOrder('desc');
        } else {
            // Select new field, start ascending
            setSortBy(field);
            setSortOrder('asc');
        }
    };


    // Clear all filters
    const handleClearFilters = () => {
        setSearch('');
        setLocationFilter('');
        setMinAmount('');
        setMaxAmount('');
    };

    const handleExport = async () => {
        try {
            // Import exceljs dynamically
            const ExcelJS = (await import('exceljs')).default;
            const { saveAs } = await import('file-saver');

            // Safety check
            if (!entries || entries.length === 0) {
                toast.warning('No entries to export');
                return;
            }

            // Get event name for sheet and filename
            const eventName = activeFunction?.name || 'Entries';

            // Calculate total amount
            const totalAmount = entries.reduce(
                (sum, item) => sum + Number(item.amount || 0),
                0
            );

            // Calculate denomination breakdown
            // Priority: use stored entry.denominations if present; greedy only as fallback
            const validNotes = [500, 200, 100, 50, 20, 10, 5, 2, 1]; // NO ₹2000
            const combinedMap = {};
            validNotes.forEach(note => { combinedMap[note] = 0; });

            entries.forEach(entry => {
                const amount = Math.round(Number(entry.amount || 0));
                if (!amount) return;

                const storedDenoms = entry.denominations;
                const hasStoredDenoms =
                    storedDenoms &&
                    typeof storedDenoms === 'object' &&
                    Object.keys(storedDenoms).length > 0;

                if (hasStoredDenoms) {
                    // ✅ Use the user's actual note breakdown — do NOT override with greedy
                    validNotes.forEach(note => {
                        const count = parseInt(storedDenoms[note] || storedDenoms[String(note)] || 0, 10);
                        if (count > 0) {
                            combinedMap[note] = (combinedMap[note] || 0) + count;
                        }
                    });
                } else {
                    // No stored denominations — fall back to greedy for this entry's amount
                    let remaining = amount;
                    for (const note of validNotes) {
                        if (remaining >= note) {
                            const count = Math.floor(remaining / note);
                            combinedMap[note] = (combinedMap[note] || 0) + count;
                            remaining = remaining % note;
                        }
                    }
                }
            });

            // Tally validation: if sum mismatches, recalculate entire total via greedy
            const tallySum = validNotes.reduce((s, note) => s + note * combinedMap[note], 0);
            if (tallySum !== totalAmount) {
                validNotes.forEach(note => { combinedMap[note] = 0; });
                let rem = Math.round(totalAmount);
                for (const note of validNotes) {
                    combinedMap[note] = Math.floor(rem / note);
                    rem = rem % note;
                }
            }

            // Build breakdown array — only include denominations with count > 0
            const denominationBreakdown = validNotes
                .filter(note => combinedMap[note] > 0)
                .map(note => ({
                    note,
                    count: combinedMap[note],
                    total: note * combinedMap[note]
                }));

            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(eventName);

            // Define columns with expanded Date width
            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 8 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Location', key: 'location', width: 20 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Date', key: 'date', width: 22 },  // Expanded for full ISO date
                { header: 'Notes', key: 'notes', width: 30 }
            ];

            // Add entry rows
            entries.forEach((entry, index) => {
                worksheet.addRow({
                    sno: index + 1,
                    name: entry.name || '',
                    location: entry.location || '',
                    amount: Number(entry.amount || 0),
                    date: entry.date || '',
                    notes: entry.notes || ''
                });
            });

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            // Add empty rows
            worksheet.addRow([]);
            worksheet.addRow([]);

            // Add summary section - Total Entries in Location column
            const totalEntriesRow = worksheet.addRow({
                sno: '',
                name: 'Total Entries',
                location: entries.length,
                amount: '',
                date: '',
                notes: ''
            });
            totalEntriesRow.font = { bold: true };

            // Add Total Amount in Amount column (column D)
            const totalAmountRow = worksheet.addRow({
                sno: '',
                name: 'Total Amount',
                location: '',
                amount: totalAmount,  // Placed in Amount column
                date: '',
                notes: ''
            });
            totalAmountRow.font = { bold: true };

            // Add empty row before denomination breakdown
            worksheet.addRow([]);

            // Add denomination breakdown header
            const breakdownHeaderRow = worksheet.addRow({
                sno: '',
                name: 'Denomination Breakdown',
                location: '',
                amount: '',
                date: '',
                notes: ''
            });
            breakdownHeaderRow.font = { bold: true, size: 12 };

            // Add denomination breakdown rows with totals in Amount column
            denominationBreakdown.forEach(({ note, count, total }) => {
                worksheet.addRow({
                    sno: '',
                    name: `₹${note} × ${count}`,
                    location: '',
                    amount: total,  // Placed in Amount column
                    date: '',
                    notes: ''
                });
            });

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Save file with event name and timestamp
            const filename = `${eventName}_${Date.now()}.xlsx`;
            saveAs(blob, filename);

            toast.success('Exported successfully!');
        } catch (error) {
            toast.error('Export failed');
            console.error('Export error:', error);
        }
    };

    const handleSwitchFunction = () => {
        // Clear active function but keep login
        localStorage.removeItem('moi_active_function');
        navigate('/functions');
    };

    const handleLogout = () => {
        // Clear everything
        localStorage.removeItem('moi_active_function');
        logout();
        navigate('/login');
    };

    const handleDeleteCurrentEvent = async () => {
        if (!activeFunction?.id) {
            toast.error(t.noActiveEventToDelete);
            return;
        }

        if (window.confirm(t.deleteEventConfirm)) {
            try {
                const result = await eventService.delete(activeFunction.id);

                if (result.success) {
                    toast.success(t.eventDeletedSuccess);

                    // Remove from localStorage
                    const storedFunctions = JSON.parse(localStorage.getItem('moi_functions') || '[]');
                    const updatedFunctions = storedFunctions.filter(f => f.id !== activeFunction.id);
                    localStorage.setItem('moi_functions', JSON.stringify(updatedFunctions));

                    // Clear active function
                    localStorage.removeItem('moi_active_function');

                    // Close menu and redirect to event selection
                    setShowMenu(false);
                    navigate('/functions');
                } else {
                    toast.error(result.message || 'Failed to delete event');
                }
            } catch (error) {
                console.error('Delete event error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to delete event';
                toast.error(errorMessage);
            }
        }
    };

    // Show loader only if no active function yet
    if (!activeFunction) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/10">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="bold" fontFamily="Arial">₹</text>
                            </svg>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-600 font-medium">{t.loadingDashboard}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/10">
            {/* Glassmorphism Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Logo + Title */}
                        <div className="flex items-center gap-3">
                            <img src="/logo.svg" alt="MPM Logo" className="w-10 h-10 md:w-12 md:h-12 drop-shadow-md flex-shrink-0" />

                            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate max-w-[200px] md:max-w-none">
                                {activeFunction ? activeFunction.name : t.moiPanamManager}
                            </h1>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Welcome Badge - Hidden on mobile */}
                            <span className="hidden sm:inline-flex px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                                👋 {t.welcome}, {user?.username || 'User'}
                            </span>

                            {/* Hamburger Menu */}
                            <div className="relative">
                                <button
                                    ref={menuButtonRef}
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95 group relative"
                                    aria-label="Menu"
                                >
                                    <svg className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>

                                    {/* Tooltip */}
                                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Menu
                                    </span>
                                </button>

                                {/* Portaled Menu & Overlay */}
                                {showMenu && createPortal(
                                    <>
                                        {/* Full-Screen Transparent Overlay */}
                                        <div
                                            className="fixed inset-0 bg-transparent"
                                            style={{ zIndex: 999 }}
                                            onClick={() => setShowMenu(false)}
                                        />

                                        {/* Menu Container */}
                                        <div
                                            className="fixed w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 py-2 animate-slideDown origin-top-right"
                                            style={{
                                                zIndex: 1000,
                                                top: `${menuPosition.top}px`,
                                                right: `${menuPosition.right}px`
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Function Info (New) */}
                                            <div className="px-4 py-2 border-b border-gray-100 mb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.currentEvent}</p>
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{activeFunction?.name}</p>
                                                    </div>

                                                    {/* Delete Event Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCurrentEvent();
                                                        }}
                                                        className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors group/delete"
                                                        aria-label="Delete current event"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-400 group-hover/delete:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Switch Event Button (New) */}
                                            <button
                                                onClick={() => {
                                                    handleSwitchFunction();
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{t.switchEvent}</span>
                                            </button>

                                            {/* Export Button */}
                                            <button
                                                onClick={() => {
                                                    handleExport();
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">{t.exportToExcel}</span>
                                            </button>

                                            {/* Divider */}
                                            <div className="my-1 border-t border-gray-200"></div>

                                            {/* Language Toggle */}
                                            <div className="px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                                        </svg>
                                                        <span className="text-sm font-medium text-gray-700">{t.languageLabel}</span>
                                                    </div>
                                                    <button
                                                        onClick={toggleLanguage}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${language === 'ta' ? 'bg-blue-600' : 'bg-gray-200'
                                                            }`}
                                                        role="switch"
                                                        aria-checked={language === 'ta'}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${language === 'ta' ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="my-1 border-t border-gray-200"></div>

                                            {/* Logout Button */}
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors group"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">{t.logout}</span>
                                            </button>
                                        </div>
                                    </>,
                                    document.body
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Left: Entry Form */}
                    <div className="lg:col-span-1">
                        <MoiEntryForm onSubmit={handleAddEntry} />
                    </div>

                    {/* Right: Entries + Filters */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t.recentEntries}</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {entries?.length || 0} {entries?.length === 1 ? t.entryFound : t.entriesFound}
                                </p>
                            </div>

                            {/* Filters Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-200"
                            >
                                <svg className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span className="hidden sm:inline font-medium text-gray-700">
                                    {showFilters ? t.hideFilters : t.showFilters}
                                </span>
                            </button>
                        </div>

                        {/* Filters - Conditionally Rendered with Animation */}
                        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <Filters
                                search={search}
                                onSearchChange={setSearch}
                                locationFilter={locationFilter}
                                onLocationChange={setLocationFilter}
                                minAmount={minAmount}
                                onMinAmountChange={setMinAmount}
                                maxAmount={maxAmount}
                                onMaxAmountChange={setMaxAmount}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortChange={handleSortChange}
                                onClearFilters={handleClearFilters}
                            />
                        </div>

                        {/* Summary Table */}
                        <SummaryTable
                            entries={entries}
                            onDelete={handleDeleteEntry}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
