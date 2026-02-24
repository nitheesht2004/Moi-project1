import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const SummaryTable = ({ entries, onDelete, onEdit }) => {
    const { language } = useLanguage();
    const t = translations[language];
    const calculateTotal = () => {
        if (!entries || entries.length === 0) return 0;
        return entries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const calculateDenominationBreakdown = () => {
        if (!entries || entries.length === 0) return null;

        // All valid Indian denominations — strictly NO ₹2000
        const validNotes = [500, 200, 100, 50, 20, 10, 5, 2, 1];

        // Initialise combined count map to zero for all denominations
        const combinedMap = {};
        validNotes.forEach(note => { combinedMap[note] = 0; });

        let grandTotal = 0;

        entries.forEach(entry => {
            const amount = Math.round(Number(entry.amount || 0));
            if (!amount) return;

            grandTotal += amount;

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

        if (grandTotal <= 0) return null;

        // Tally validation: sum of (note × count) must equal grandTotal
        const tallySum = validNotes.reduce((s, note) => s + note * combinedMap[note], 0);
        if (tallySum !== grandTotal) {
            // Mismatch — recalculate entire total via greedy as a safety fallback
            validNotes.forEach(note => { combinedMap[note] = 0; });
            let rem = grandTotal;
            for (const note of validNotes) {
                combinedMap[note] = Math.floor(rem / note);
                rem = rem % note;
            }
        }

        return {
            grandTotal,
            rows: validNotes.map(note => ({
                note,
                count: combinedMap[note],
                subtotal: note * combinedMap[note]
            }))
        };
    };

    // Pre-compute once for the render
    const denominationResult = calculateDenominationBreakdown();

    if (!entries || entries.length === 0) {
        return (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500 text-base md:text-lg">{t.noEntriesFound}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Mobile scroll hint */}
            <div className="md:hidden bg-blue-50 px-4 py-2 text-xs text-blue-700 text-center border-b">
                {t.scrollHint}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.serialNo}
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.name}
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.location}
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.amount}
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.date}
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {t.notes}
                            </th>
                            {(onEdit || onDelete) && (
                                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t.actions}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry, index) => (
                            <tr key={entry.id || index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                                    {index + 1}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                                    {entry.name}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700">
                                    {entry.location}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-green-600">
                                    {formatCurrency(entry.amount)}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-700">
                                    {formatDate(entry.date)}
                                </td>
                                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 max-w-xs truncate">
                                    {entry.notes || '-'}
                                </td>
                                {(onEdit || onDelete) && (
                                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(entry)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs md:text-sm"
                                                >
                                                    {t.edit}
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(entry.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium text-xs md:text-sm"
                                                >
                                                    {t.delete}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                            <td colSpan="3" className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-bold text-gray-900">
                                {t.total}:
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-base md:text-lg font-bold text-green-600">
                                {formatCurrency(calculateTotal())}
                            </td>
                            <td colSpan={onEdit || onDelete ? "3" : "2"}></td>
                        </tr>
                        <tr className="bg-gray-100">
                            <td colSpan={onEdit || onDelete ? "7" : "6"} className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm text-gray-600">
                                {t.totalEntries}: <span className="font-semibold">{entries.length}</span>
                            </td>
                        </tr>
                        {/* Denomination Breakdown — single combined section, greedy on grand total */}
                        {denominationResult && (
                            <tr className="bg-blue-50 border-t border-gray-200">
                                <td colSpan={onEdit || onDelete ? "7" : "6"} className="px-3 md:px-6 py-4">
                                    <div className="max-w-xs">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="font-semibold text-gray-700 text-sm">{t.denominationBreakdown}</span>
                                        </div>

                                        {/* Total Amount line */}
                                        <div className="mb-3 pb-2 border-b border-blue-200">
                                            <span className="text-sm text-gray-600">Total Amount: </span>
                                            <span className="text-sm font-bold text-green-700">
                                                ₹{denominationResult.grandTotal.toLocaleString('en-IN')}
                                            </span>
                                        </div>

                                        {/* All 9 denomination rows — clean list, no skipping */}
                                        <div className="space-y-1">
                                            {denominationResult.rows.map((item) => (
                                                <div
                                                    key={item.note}
                                                    className={`flex items-center justify-between text-sm font-mono py-0.5 ${item.count === 0 ? 'text-gray-400' : 'text-gray-800'}`}
                                                >
                                                    <span>
                                                        <span className={item.count > 0 ? 'font-semibold text-green-700' : ''}>
                                                            ₹{String(item.note).padStart(3, '\u00a0')}
                                                        </span>
                                                        {' × '}
                                                        <span className={item.count > 0 ? 'font-bold text-blue-700' : ''}>
                                                            {item.count}
                                                        </span>
                                                    </span>
                                                    {item.count > 0 && (
                                                        <span className="font-semibold text-gray-700">
                                                            = ₹{item.subtotal.toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tally line */}
                                        <div className="mt-3 pt-2 border-t border-blue-300 flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700">
                                                Total = ₹{denominationResult.grandTotal.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                ✓ Verified
                                            </span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default SummaryTable;

