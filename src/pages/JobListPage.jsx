import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, LayoutGrid, List, Calendar, User, Clock, Pencil, Trash2, AlertTriangle, X, Save, CheckCircle } from 'lucide-react';
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

    // Modal States
    const [selectedJob, setSelectedJob] = useState(null);
    const [modalType, setModalType] = useState(null); // 'edit', 'delete', 'delay', 'status'
    const [formData, setFormData] = useState({});

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
            // Helper for sorting
            const sortJobsList = (list) => {
                return list.sort((a, b) => {
                    if (sortBy === 'created_at_desc') {
                        return new Date(b.created_at) - new Date(a.created_at);
                    } else if (sortBy === 'created_at_asc') {
                        return new Date(a.created_at) - new Date(b.created_at);
                    } else if (sortBy === 'delivery_date_asc') {
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
            };

            if (search) {
                // Composite Search: Customers + Jobs
                const encodedSearch = encodeURIComponent(search);

                // 1. Search Customers
                const customersResponse = await api.get(`/api/v1/customers?search=${encodedSearch}`);
                const matchingCustomers = customersResponse.data.items || [];
                const customerIds = matchingCustomers.map(c => c.id);

                // 2. Fetch jobs
                const promises = [
                    // Direct search
                    api.get(`/api/v1/jobs?search=${encodedSearch}&page_size=100${statusFilter ? `&status_filter=${statusFilter}` : ''}`),
                    // Customer matches (limit to top 5)
                    ...customerIds.slice(0, 5).map(id =>
                        api.get(`/api/v1/jobs?customer_id=${id}&page_size=100${statusFilter ? `&status_filter=${statusFilter}` : ''}`)
                    )
                ];

                const responses = await Promise.all(promises);
                let allJobs = [];
                responses.forEach(res => {
                    if (res.data.items) {
                        allJobs = [...allJobs, ...res.data.items];
                    }
                });

                // Deduplicate by ID
                const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());

                setJobs(sortJobsList(uniqueJobs));
                setTotalPages(1);
            } else {
                // Standard Fetch
                let query = `/api/v1/jobs?page=${page}&page_size=${pageSize}`;
                if (statusFilter) query += `&status_filter=${statusFilter}`;

                const response = await api.get(query);
                let fetchedJobs = response.data.items || [];
                setJobs(sortJobsList(fetchedJobs));
                setTotalPages(response.data.pages || 1);
            }
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
        if (newStatus) {
            setSearchParams({ status_filter: newStatus });
        } else {
            setSearchParams({});
        }
    };

    // Actions
    const openEditModal = (job, e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setFormData({
            estimated_cost: job.estimated_cost,
            estimated_parts_cost: job.estimated_parts_cost,
            estimated_labour_cost: job.estimated_labour_cost,
            deduction: job.deduction,
            deduction_note: job.deduction_note,
            additional_charge: job.additional_charge,
            additional_charge_note: job.additional_charge_note,
            actual_cost: job.actual_cost,
            estimated_delivery_date: job.estimated_delivery_date,
            notes: job.notes
        });
        setModalType('edit');
    };

    const openDeleteModal = (job, e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setModalType('delete');
    };

    const openDelayModal = (job, e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setFormData({
            delay_reason: '',
            new_estimated_delivery_date: job.estimated_delivery_date || ''
        });
        setModalType('delay');
    };

    const openStatusModal = (job, e) => {
        e.stopPropagation();
        setSelectedJob(job);
        setFormData({
            status: job.status,
            notes: ''
        });
        setModalType('status');
    };

    const closeModal = () => {
        setSelectedJob(null);
        setModalType(null);
        setFormData({});
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/api/v1/jobs/${selectedJob.id}`, formData);
            fetchJobs();
            closeModal();
        } catch (error) {
            console.error("Error updating job:", error);
            alert("Failed to update job");
        }
    };

    const handleDeleteJob = async () => {
        try {
            await api.delete(`/api/v1/jobs/${selectedJob.id}`);
            fetchJobs();
            closeModal();
        } catch (error) {
            console.error("Error deleting job:", error);
            alert("Failed to delete job");
        }
    };

    const handleDelayJob = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/v1/jobs/${selectedJob.id}/delay`, formData);
            fetchJobs();
            closeModal();
        } catch (error) {
            console.error("Error adding delay:", error);
            alert("Failed to add delay");
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/api/v1/jobs/${selectedJob.id}/status`, formData);
            fetchJobs();
            closeModal();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    // Helper to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-100';
            case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
            case 'indented': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'parts_received': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'booked': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
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
                        placeholder="Search by Job ID, Customer, Phone..."
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
                                                    <span className="font-mono text-sm font-medium text-gray-900">#{job.job_number || job.id}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{job.customer?.name || `Customer #${job.customer_id}`}</div>
                                                    {job.customer?.contact_number && (
                                                        <div className="text-xs text-gray-500">{job.customer.contact_number}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={(e) => openStatusModal(job, e)}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border hover:scale-105 transition-transform ${getStatusColor(job.status)}`}
                                                    >
                                                        {job.status.replace(/_/g, ' ')}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(job.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {job.estimated_delivery_date ? new Date(job.estimated_delivery_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
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
                                                        <button
                                                            onClick={(e) => openEditModal(job, e)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Edit Job"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => openDelayModal(job, e)}
                                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="Add Delay"
                                                        >
                                                            <Clock size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => openDeleteModal(job, e)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Job"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
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
                                <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">#{job.job_number || job.id}</span>
                                        <button
                                            onClick={(e) => openStatusModal(job, e)}
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border hover:scale-105 transition-transform ${getStatusColor(job.status)}`}
                                        >
                                            {job.status.replace(/_/g, ' ')}
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <User size={16} className="text-gray-400" />
                                            <span className="text-sm">{job.customer?.name || `Customer #${job.customer_id}`}</span>
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

                                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                                        <button
                                            onClick={(e) => openEditModal(job, e)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="Edit Job"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => openDelayModal(job, e)}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                            title="Add Delay"
                                        >
                                            <Clock size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => openDeleteModal(job, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Job"
                                        >
                                            <Trash2 size={18} />
                                        </button>
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

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalType === 'edit' && 'Edit Job'}
                                {modalType === 'delete' && 'Delete Job'}
                                {modalType === 'delay' && 'Add Job Delay'}
                                {modalType === 'status' && 'Update Job Status'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalType === 'edit' && (
                                <form onSubmit={handleUpdateJob} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost</label>
                                            <input type="number" step="0.01" value={formData.estimated_cost} onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                                            <input type="date" value={formData.estimated_delivery_date?.split('T')[0]} onChange={e => setFormData({ ...formData, estimated_delivery_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3"></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'delete' && (
                                <div>
                                    <div className="flex items-center gap-4 mb-6 bg-red-50 p-4 rounded-xl text-red-700">
                                        <AlertTriangle size={24} />
                                        <p>Are you sure you want to delete this job? This action cannot be undone.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button onClick={handleDeleteJob} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Job</button>
                                    </div>
                                </div>
                            )}

                            {modalType === 'delay' && (
                                <form onSubmit={handleDelayJob} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Delivery Date</label>
                                        <input type="date" required value={formData.new_estimated_delivery_date?.split('T')[0]} onChange={e => setFormData({ ...formData, new_estimated_delivery_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delay Reason</label>
                                        <textarea required value={formData.delay_reason} onChange={e => setFormData({ ...formData, delay_reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3" placeholder="Explain why the job is delayed..."></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Add Delay</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'status' && (
                                <form onSubmit={handleUpdateStatus} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200">
                                            <option value="booked">Booked</option>
                                            <option value="indented">Indented</option>
                                            <option value="parts_received">Parts Received</option>
                                            <option value="completed">Completed</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Note</label>
                                        <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3" placeholder="Optional note about this status change..."></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobListPage;
