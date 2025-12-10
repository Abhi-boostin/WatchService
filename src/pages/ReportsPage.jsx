import React, { useState } from 'react';
import { FileBarChart, Calendar, Clock, Download, Loader2, Filter } from 'lucide-react';
import api from '../services/api';

const ReportsPage = () => {
    const [loading, setLoading] = useState(false);

    // Date Wise Report State
    const [reportType, setReportType] = useState('pending_repair');
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Delay Report State
    const [delayDays, setDelayDays] = useState(15);
    const [includeCancelled, setIncludeCancelled] = useState(false);

    const reportTypes = [
        { id: 'pending_repair', label: 'Pending Repairs', requiresDate: false },
        { id: 'repair_status', label: 'Repair Status', requiresDate: true },
        { id: 'indent_status', label: 'Indent Status', requiresDate: true },
        { id: 'delivered', label: 'Delivered Jobs', requiresDate: true }
    ];

    const handleDownload = (response, defaultFilename) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Try to extract filename from content-disposition
        const contentDisposition = response.headers['content-disposition'];
        let filename = defaultFilename;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch.length === 2)
                filename = filenameMatch[1];
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const generateDateWiseReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                report_type: reportType,
                date_from: dateRange.from,
                date_to: dateRange.to,
                customer_id: 0,
                brand_id: 0
            };

            const response = await api.post('/api/v1/reports/date-wise', payload, {
                responseType: 'blob'
            });

            handleDownload(response, `${reportType}_report.xlsx`);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const generateDelayReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                min_delay_days: parseInt(delayDays),
                include_cancelled: includeCancelled,
                customer_id: 0,
                brand_id: 0
            };

            const response = await api.post('/api/v1/reports/delay', payload, {
                responseType: 'blob'
            });

            handleDownload(response, `delay_report_${delayDays}days.xlsx`);
        } catch (error) {
            console.error("Error generating delay report:", error);
            alert("Failed to generate delay report.");
        } finally {
            setLoading(false);
        }
    };

    const selectedReportType = reportTypes.find(t => t.id === reportType);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
                <p className="text-gray-500 mt-1">Generate and download operational reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Date Wise Reports Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <FileBarChart size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Standard Reports</h2>
                            <p className="text-sm text-gray-500">Daily operational summaries</p>
                        </div>
                    </div>

                    <form onSubmit={generateDateWiseReport} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {reportTypes.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setReportType(type.id)}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border ${reportType === type.id
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedReportType?.requiresDate && (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[#0F172A] text-white py-3 rounded-xl hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                            <span>Download Report</span>
                        </button>
                    </form>
                </div>

                {/* Delay Analysis Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Delay Analysis</h2>
                            <p className="text-sm text-gray-500">Track delayed jobs and bottlenecks</p>
                        </div>
                    </div>

                    <form onSubmit={generateDelayReport} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Delay (Days)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={delayDays}
                                    onChange={(e) => setDelayDays(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-100 focus:border-amber-600 outline-none"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Days</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Jobs delayed by more than {delayDays} days will be included.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <input
                                type="checkbox"
                                id="includeCancelled"
                                checked={includeCancelled}
                                onChange={(e) => setIncludeCancelled(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                            <label htmlFor="includeCancelled" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                Include Cancelled Jobs
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                            <span>Download Delay Report</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
