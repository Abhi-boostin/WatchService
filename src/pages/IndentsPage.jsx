import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Package, Truck, Calendar, Eye, Filter, X } from 'lucide-react';
import api from '../services/api';

const IndentsPage = () => {
    const navigate = useNavigate();
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(20);

    // Filters
    const [search, setSearch] = useState('');
    const [filterJobId, setFilterJobId] = useState('');
    const [filterSupplierId, setFilterSupplierId] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Create Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        job_id: '',
        supplier_id: '',
        notes: ''
    });
    const [availableJobs, setAvailableJobs] = useState([]);
    const [availableSuppliers, setAvailableSuppliers] = useState([]);

    useEffect(() => {
        fetchIndents();
    }, [page, search, filterJobId, filterSupplierId]);

    useEffect(() => {
        if (showFilters) {
            fetchFilterOptions();
        }
    }, [showFilters]);

    const fetchIndents = async () => {
        setLoading(true);
        try {
            let url = `/api/v1/indents?page=${page}&page_size=${pageSize}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filterJobId) url += `&job_id=${filterJobId}`;
            if (filterSupplierId) url += `&supplier_id=${filterSupplierId}`;

            const response = await api.get(url);
            setIndents(response.data.items || []);
            setTotalPages(response.data.pagination?.total_pages || 1);

            // Fetch job and supplier details for display
            const jobIds = [...new Set(response.data.items.map(i => i.job_id))];
            const supplierIds = [...new Set(response.data.items.map(i => i.supplier_id).filter(Boolean))];

            if (jobIds.length > 0) {
                const jobPromises = jobIds.map(id => api.get(`/api/v1/jobs/${id}`).catch(() => null));
                const jobResults = await Promise.all(jobPromises);
                const jobsMap = {};
                jobResults.forEach(result => {
                    if (result?.data) {
                        jobsMap[result.data.id] = result.data;
                    }
                });
                setJobs(jobsMap);
            }

            if (supplierIds.length > 0) {
                const supplierPromises = supplierIds.map(id => api.get(`/api/v1/suppliers/${id}`).catch(() => null));
                const supplierResults = await Promise.all(supplierPromises);
                const suppliersMap = {};
                supplierResults.forEach(result => {
                    if (result?.data) {
                        suppliersMap[result.data.id] = result.data;
                    }
                });
                setSuppliers(suppliersMap);
            }
        } catch (error) {
            console.error("Error fetching indents:", error);
            setIndents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const [jobsRes, suppliersRes] = await Promise.all([
                api.get('/api/v1/jobs?page_size=100'),
                api.get('/api/v1/suppliers?page_size=100')
            ]);
            setAvailableJobs(jobsRes.data.items || []);
            setAvailableSuppliers(suppliersRes.data.items || []);
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    const handleClearFilters = () => {
        setFilterJobId('');
        setFilterSupplierId('');
        setPage(1);
    };

    const handleOpenCreateModal = async () => {
        try {
            const [jobsRes, suppliersRes] = await Promise.all([
                api.get('/api/v1/jobs?page_size=100'),
                api.get('/api/v1/suppliers?page_size=100')
            ]);
            
            const fetchedJobs = jobsRes.data.items || [];
            // Sort jobs by created_at descending
            fetchedJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setAvailableJobs(fetchedJobs);
            setAvailableSuppliers(suppliersRes.data.items || []);
            setShowCreateModal(true);
            setCreateForm({
                job_id: '',
                supplier_id: '',
                notes: ''
            });
        } catch (error) {
            console.error("Error loading create modal data:", error);
            alert("Failed to load data for creating indent");
        }
    };

    const handleCreateIndent = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                job_id: parseInt(createForm.job_id),
                supplier_id: createForm.supplier_id ? parseInt(createForm.supplier_id) : null,
                notes: createForm.notes || null
            };

            const response = await api.post('/api/v1/indents', payload);
            setShowCreateModal(false);
            
            // Navigate to the detail page to add parts
            navigate(`/indents/${response.data.id}`);
        } catch (error) {
            console.error("Error creating indent:", error);
            alert(error.response?.data?.detail || "Failed to create indent");
        }
    };

    const handleViewIndent = (indentId) => {
        navigate(`/indents/${indentId}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Indents</h1>
                    <p className="text-gray-500 mt-1">Manage spare parts orders for jobs</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                    <Plus size={20} />
                    Create Indent
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by Indent #, Job #, or Supplier..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter size={16} />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    {(search || filterJobId || filterSupplierId) && (
                        <button
                            onClick={() => { setSearch(''); handleClearFilters(); }}
                            className="text-sm text-blue-600 hover:text-blue-700 px-4 py-2.5"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Job</label>
                            <select
                                value={filterJobId}
                                onChange={(e) => { setFilterJobId(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Jobs</option>
                                {availableJobs.map(job => (
                                    <option key={job.id} value={job.id}>
                                        {job.job_number || `Job #${job.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Supplier</label>
                            <select
                                value={filterSupplierId}
                                onChange={(e) => { setFilterSupplierId(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Suppliers</option>
                                {availableSuppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Indents Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : indents.length > 0 ? (
                <>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Indent #</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job #</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Notes</th>
                                        <th className="sticky right-0 bg-gray-50/50 px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {indents.map((indent) => (
                                        <tr
                                            key={indent.id}
                                            onClick={() => handleViewIndent(indent.id)}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="font-mono text-sm font-medium text-gray-900">{indent.serial_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {jobs[indent.job_id]?.job_number || `Job #${indent.job_id}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Truck size={14} className="text-gray-400" />
                                                    <span className="text-sm text-gray-900">{suppliers[indent.supplier_id]?.name || 'No supplier'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                                                {new Date(indent.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate hidden lg:table-cell">
                                                {indent.notes || '-'}
                                            </td>
                                            <td className="sticky right-0 bg-white group-hover:bg-gray-50/50 px-6 py-4 whitespace-nowrap text-right shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewIndent(indent.id);
                                                    }}
                                                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all touch-manipulation"
                                                    title="View Details"
                                                    aria-label="View indent details"
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
                            <div className="text-sm text-gray-500">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">
                        {search || filterJobId || filterSupplierId ? 'No indents found matching your search or filters' : 'No indents found'}
                    </p>
                    {!search && !filterJobId && !filterSupplierId && (
                        <button
                            onClick={handleOpenCreateModal}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Create your first indent
                        </button>
                    )}
                </div>
            )}

            {/* Create Indent Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Create New Indent</h3>
                                <p className="text-sm text-gray-500 mt-1">Create an indent to order spare parts for a job</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateIndent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Job <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={createForm.job_id}
                                    onChange={e => setCreateForm({ ...createForm, job_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a job</option>
                                    {availableJobs.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.job_number || `Job #${job.id}`} - Customer #{job.customer_id}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    The job status will be automatically updated to "indented"
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier (Optional)
                                </label>
                                <select
                                    value={createForm.supplier_id}
                                    onChange={e => setCreateForm({ ...createForm, supplier_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a supplier (optional)</option>
                                    {availableSuppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={createForm.notes}
                                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="e.g., Urgent parts needed for Rolex repair"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Next step:</strong> After creating the indent, you'll be able to add spare parts from the catalog.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Create Indent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IndentsPage;
