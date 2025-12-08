import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, LayoutGrid, List, Calendar, User, Clock } from 'lucide-react';
import api from '../services/api';

const JobListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status_filter') || '');
    const [sortBy, setSortBy] = useState('created_at_desc');
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        // Update filter if URL param changes
        const paramStatus = searchParams.get('status_filter');
        if (paramStatus !== statusFilter) {
            setStatusFilter(paramStatus || '');
            setPage(1);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchJobs();
    }, [page, search, statusFilter, sortBy, pageSize]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            let query = `/api/v1/jobs?page=${page}&page_size=${pageSize}`;
            if (search) query += `&search=${search}`;
            if (statusFilter) query += `&status_filter=${statusFilter}`;

            const response = await api.get(query);
            let fetchedJobs = response.data.items || [];

            // Client-side sorting
            fetchedJobs.sort((a, b) => {
                if (sortBy === 'created_at_desc') {
                    return new Date(b.created_at) - new Date(a.created_at);
                } else if (sortBy === 'created_at_asc') {
                    return new Date(a.created_at) - new Date(b.created_at);
                } else if (sortBy === 'delivery_date_asc') {
                    // Handle null dates (put them last)
                    if (!a.estimated_delivery_date) return 1;
                    if (!b.estimated_delivery_date) return -1;
                    return new Date(a.estimated_delivery_date) - new Date(b.estimated_delivery_date);
                } else if (sortBy === 'delivery_date_desc') {
                    if (!a.estimated_delivery_date) return 1;
                    if (!b.estimated_delivery_date) return -1;
                    return new Date(b.estimated_delivery_date) - new Date(a.estimated_delivery_date);
                }
                return 0;
            });

            setJobs(fetchedJobs);
            setTotalPages(response.data.pages || 1);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        setPage(1);

        // Update URL params
        if (newStatus) {
            setSearchParams({ status_filter: newStatus });
        } else {
            setSearchParams({});
        }
    };

    // Helper to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-100';
            case 'indented': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'parts_received': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'waiting_for_parts': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'delivered': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
                    <p className="text-gray-500 mt-1">View and manage all service jobs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            title="List View"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/jobs/new')}
                        className="px-6 py-2.5 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors shadow-lg shadow-gray-900/20"
                    >
                        New Booking
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by Job ID or Customer ID..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    />
                </div>
                <div className="w-full md:w-48 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all appearance-none bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="booked">Booked</option>
                        <option value="indented">Indented</option>
                        <option value="parts_received">Parts Received</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="w-full md:w-48 relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all appearance-none bg-white"
                    >
                        <option value="created_at_desc">Newest First</option>
                        <option value="created_at_asc">Oldest First</option>
                        <option value="delivery_date_asc">Delivery: Soonest</option>
                        <option value="delivery_date_desc">Delivery: Latest</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg">No jobs found matching your criteria.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'table' ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Delivery</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {jobs.map((job) => (
                                            <tr
                                                key={job.id}
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm font-medium text-gray-900">#{job.id}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">Customer #{job.customer_id}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusColor(job.status)}`}>
                                                        {job.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(job.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {job.estimated_delivery_date ? new Date(job.estimated_delivery_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/jobs/${job.id}`);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => (
                                <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">#{job.id}</span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusColor(job.status)}`}>
                                            {job.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <User size={16} className="text-gray-400" />
                                            <span className="text-sm">Customer #{job.customer_id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span className="text-sm">Created: {new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {job.estimated_delivery_date && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="text-sm">Due: {new Date(job.estimated_delivery_date).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                                        <span className="text-sm font-medium text-blue-600 group-hover:underline">View Details &rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 mt-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="px-2 py-1 rounded border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobListPage;
