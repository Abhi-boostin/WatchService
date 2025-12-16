import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Search, Package } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorUtils';

const SparePartsPage = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(20);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedPart, setSelectedPart] = useState(null);
    const [formData, setFormData] = useState({
        part_name: '',
        description: '',
        estimated_delivery_days: ''
    });

    const fetchParts = useCallback(async () => {
        setLoading(true);
        try {
            let query = `/api/v1/spare-parts?page=${page}&page_size=${pageSize}`;
            if (search) query += `&search=${encodeURIComponent(search)}`;

            const response = await api.get(query);
            setParts(response.data.items || []);
            setTotalPages(response.data.pagination?.total_pages || 1);
        } catch (error) {
            console.error("Error fetching spare parts:", error);
            setParts([]);
        } finally {
            setLoading(false);
        }
    }, [page, search, pageSize]);

    useEffect(() => {
        fetchParts();
    }, [fetchParts]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            part_name: '',
            description: '',
            estimated_delivery_days: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (part) => {
        setModalMode('edit');
        setSelectedPart(part);
        setFormData({
            part_name: part.part_name,
            description: part.description || '',
            estimated_delivery_days: part.estimated_delivery_days || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                part_name: formData.part_name,
                description: formData.description || null
            };

            // Add estimated_delivery_days if provided
            if (formData.estimated_delivery_days) {
                payload.estimated_delivery_days = parseInt(formData.estimated_delivery_days);
            }

            if (modalMode === 'create') {
                await api.post('/api/v1/spare-parts', payload);
            } else {
                await api.patch(`/api/v1/spare-parts/${selectedPart.id}`, payload);
            }

            fetchParts();
            setShowModal(false);
        } catch (error) {
            console.error("Error saving spare part:", error);
            alert(getErrorMessage(error, "Failed to save spare part"));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this spare part?")) return;
        try {
            await api.delete(`/api/v1/spare-parts/${id}`);
            fetchParts();
        } catch (error) {
            console.error("Error deleting spare part:", error);
            alert(getErrorMessage(error, "Failed to delete spare part"));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Spare Parts</h1>
                    <p className="text-gray-500 mt-1">Manage spare parts catalog</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                    <Plus size={20} />
                    Add Part
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by part name..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Part Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Description</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery Days</th>
                            <th className="sticky right-0 bg-gray-50/50 px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : parts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No spare parts found.</td>
                            </tr>
                        ) : (
                            parts.map((part) => (
                                <tr key={part.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <Package size={18} />
                                            </div>
                                            <span className="font-medium text-gray-900">{part.part_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate hidden lg:table-cell">
                                        {part.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {part.estimated_delivery_days ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {part.estimated_delivery_days} days
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Not set</span>
                                        )}
                                    </td>
                                    <td className="sticky right-0 bg-white group-hover:bg-gray-50/50 px-6 py-4 whitespace-nowrap text-right shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(part)}
                                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                                                title="Edit Part"
                                                aria-label="Edit spare part"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(part.id)}
                                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                                                title="Delete Part"
                                                aria-label="Delete spare part"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 mt-6 rounded-xl">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'create' ? 'Add Spare Part' : 'Edit Spare Part'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={255}
                                    value={formData.part_name}
                                    onChange={e => setFormData({ ...formData, part_name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Main Spring, Balance Wheel, Crown Assembly"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Optional description of the spare part..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={formData.estimated_delivery_days}
                                    onChange={e => setFormData({ ...formData, estimated_delivery_days: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 15"
                                />
                                <p className="text-xs text-gray-500 mt-1">Expected delivery time in days (optional, 1-365)</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Part
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SparePartsPage;
