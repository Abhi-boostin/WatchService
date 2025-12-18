import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Package, FileText, Truck, Calendar, History, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { auditService } from '../services/api';
import { exportIndentPDF } from '../services/pdfService';
import { getErrorMessage } from '../utils/errorUtils';
import AuditTimeline from '../components/common/AuditTimeline';

const IndentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [indent, setIndent] = useState(null);
    const [job, setJob] = useState(null);
    const [supplier, setSupplier] = useState(null);
    
    // Edit mode
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        supplier_id: '',
        notes: ''
    });

    // Add part modal
    const [showAddPartModal, setShowAddPartModal] = useState(false);
    const [allSpareParts, setAllSpareParts] = useState([]);
    const [selectedSparePartId, setSelectedSparePartId] = useState('');
    const [partQuantity, setPartQuantity] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit part modal
    const [editingPart, setEditingPart] = useState(null);
    const [editPartQuantity, setEditPartQuantity] = useState(1);

    // PDF export state
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    
    // User state for permissions
    const [currentUser, setCurrentUser] = useState(null);
    
    // Audit history state
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditEvents, setAuditEvents] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditError, setAuditError] = useState(null);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(1);

    // Fetch current user for permissions
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.get('/api/v1/auth/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Failed to fetch current user:", error);
            }
        };
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        fetchIndentDetails();
    }, [id]);

    const fetchIndentDetails = async () => {
        setLoading(true);
        try {
            // Fetch indent with parts using the correct endpoint
            const indentResponse = await api.get(`/api/v1/indents/${id}/with-parts`);
            setIndent(indentResponse.data);
            
            // Fetch job details
            const jobResponse = await api.get(`/api/v1/jobs/${indentResponse.data.job_id}`);
            setJob(jobResponse.data);

            // Supplier is now included in the indent response
            if (indentResponse.data.supplier) {
                setSupplier(indentResponse.data.supplier);
            }

            setEditForm({
                supplier_id: indentResponse.data.supplier_id || '',
                notes: indentResponse.data.notes || ''
            });
        } catch (error) {
            console.error("Error fetching indent details:", error);
            alert(getErrorMessage(error, "Failed to load indent details"));
            navigate('/indents');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllSpareParts = async () => {
        try {
            const response = await api.get('/api/v1/spare-parts/all');
            setAllSpareParts(response.data);
        } catch (error) {
            console.error("Error fetching spare parts:", error);
        }
    };

    const handleOpenAddPartModal = () => {
        fetchAllSpareParts();
        setShowAddPartModal(true);
        setSelectedSparePartId('');
        setPartQuantity(1);
        setSearchTerm('');
    };

    const handleAddPart = async (e) => {
        e.preventDefault();
        if (!selectedSparePartId) return;

        try {
            await api.post(`/api/v1/indents/${id}/parts`, {
                spare_part_id: parseInt(selectedSparePartId),
                quantity: parseInt(partQuantity)
            });
            
            setShowAddPartModal(false);
            fetchIndentDetails();
        } catch (error) {
            console.error("Error adding part:", error);
            alert(getErrorMessage(error, "Failed to add part to indent"));
        }
    };

    const handleOpenEditPart = (part) => {
        setEditingPart(part);
        setEditPartQuantity(part.quantity);
    };

    const handleUpdatePart = async (e) => {
        e.preventDefault();
        if (!editingPart) return;

        try {
            await api.patch(`/api/v1/indents/${id}/parts/${editingPart.spare_part_id}`, {
                quantity: parseInt(editPartQuantity)
            });
            
            setEditingPart(null);
            fetchIndentDetails();
        } catch (error) {
            console.error("Error updating part:", error);
            alert(getErrorMessage(error, "Failed to update part quantity"));
        }
    };

    const handleRemovePart = async (sparePartId) => {
        if (!window.confirm("Are you sure you want to remove this part from the indent?")) return;

        try {
            await api.delete(`/api/v1/indents/${id}/parts/${sparePartId}`);
            fetchIndentDetails();
        } catch (error) {
            console.error("Error removing part:", error);
            alert(getErrorMessage(error, "Failed to remove part"));
        }
    };

    const handleUpdateIndent = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/api/v1/indents/${id}`, editForm);
            setEditMode(false);
            fetchIndentDetails();
        } catch (error) {
            console.error("Error updating indent:", error);
            alert(getErrorMessage(error, "Failed to update indent"));
        }
    };

    const handleDeleteIndent = async () => {
        if (!window.confirm("Are you sure you want to delete this indent? This action cannot be undone. Note: This will NOT automatically revert the job status.")) return;

        try {
            await api.delete(`/api/v1/indents/${id}`);
            navigate('/indents');
        } catch (error) {
            console.error("Error deleting indent:", error);
            alert(getErrorMessage(error, "Failed to delete indent"));
        }
    };
    
    // Audit history functions
    const handleOpenAuditModal = () => {
        setShowAuditModal(true);
        fetchAuditHistory(1);
    };
    
    const handleCloseAuditModal = () => {
        setShowAuditModal(false);
        setAuditEvents([]);
        setAuditError(null);
        setAuditPage(1);
    };
    
    const fetchAuditHistory = async (page = 1) => {
        if (!indent) return;
        
        setAuditLoading(true);
        setAuditError(null);
        try {
            const response = await auditService.getIndentAuditHistory(indent.id, page, 20);
            setAuditEvents(response || []);
            setAuditTotalPages(response && response.length === 20 ? page + 1 : page);
        } catch (error) {
            console.error("Failed to fetch audit history:", error);
            setAuditError(getErrorMessage(error, "Failed to load audit history"));
        } finally {
            setAuditLoading(false);
        }
    };
    
    const handleAuditPageChange = (newPage) => {
        setAuditPage(newPage);
        fetchAuditHistory(newPage);
    };

    const handleExportPDF = async () => {
        if (!indent) {
            alert("Indent information is not available.");
            return;
        }

        try {
            setIsExportingPDF(true);
            const serialNumber = indent.serial_number || `#${indent.id}`;
            await exportIndentPDF(indent.id, serialNumber);
            
            // Success feedback
            setTimeout(() => {
                alert("PDF exported successfully! Check your downloads folder.");
            }, 500);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert(getErrorMessage(error, "Failed to export PDF. Please try again."));
        } finally {
            setIsExportingPDF(false);
        }
    };


    const filteredSpareParts = allSpareParts.filter(part => 
        part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!indent) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-gray-500">Indent not found</p>
                    <button onClick={() => navigate('/indents')} className="mt-4 text-blue-600 hover:underline">
                        Back to Indents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/indents')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Indents
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{indent.serial_number}</h1>
                        <p className="text-gray-500 mt-1">Indent Details & Parts Management</p>
                    </div>
                    <div className="flex gap-2">
                        {!editMode && (
                            <>
                                <button
                                    onClick={() => navigate(`/jobs/${indent.job_id}`)}
                                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50"
                                    title="View related job"
                                >
                                    <ExternalLink size={18} />
                                    View Job
                                </button>
                                {currentUser && (currentUser.is_admin || currentUser.is_manager) && (
                                    <button
                                        onClick={handleOpenAuditModal}
                                        className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50"
                                    >
                                        <History size={18} />
                                        View History
                                    </button>
                                )}
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                >
                                    <Pencil size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExportingPDF}
                                    className="flex items-center gap-2 px-4 py-2 text-green-600 bg-white border border-green-200 rounded-xl hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText size={18} />
                                    {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                                </button>
                                <button
                                    onClick={handleDeleteIndent}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50"
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Indent Information */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Indent Information</h2>
                
                {editMode ? (
                    <form onSubmit={handleUpdateIndent} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                <input
                                    type="text"
                                    disabled
                                    value={indent.serial_number}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
                                <input
                                    type="text"
                                    disabled
                                    value={job?.job_number || `Job #${indent.job_id}`}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={editForm.notes}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Serial Number</p>
                                <p className="font-medium text-gray-900">{indent.serial_number}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Job</p>
                                <button
                                    onClick={() => navigate(`/jobs/${indent.job_id}`)}
                                    className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                >
                                    {job?.job_number || `Job #${indent.job_id}`}
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Truck size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Supplier</p>
                                <p className="font-medium text-gray-900">{supplier?.name || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(indent.created_at).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        </div>
                        {indent.notes && (
                            <div className="col-span-full">
                                <p className="text-sm text-gray-500 mb-1">Notes</p>
                                <p className="text-gray-900">{indent.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Parts Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Spare Parts</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {indent.parts?.length || 0} part{indent.parts?.length !== 1 ? 's' : ''} in this indent
                        </p>
                    </div>
                    <button
                        onClick={handleOpenAddPartModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Add Part
                    </button>
                </div>

                {indent.parts && indent.parts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Part Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {indent.parts.map((part, index) => (
                                    <tr key={part.indent_part_id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                    <Package size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{part.part_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                                            {part.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                                {part.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEditPart(part)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit quantity"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemovePart(part.spare_part_id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Remove part"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-4">No parts added to this indent yet</p>
                        <button
                            onClick={handleOpenAddPartModal}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Add your first part
                        </button>
                    </div>
                )}

            </div>

            {/* Add Part Modal */}
            {showAddPartModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Add Part to Indent</h3>
                            <button onClick={() => setShowAddPartModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddPart} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Spare Parts</label>
                                    <input
                                        type="text"
                                        placeholder="Search by part name or number..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Spare Part</label>
                                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                        {filteredSpareParts.length > 0 ? (
                                            filteredSpareParts.map((part) => (
                                                <div
                                                    key={part.id}
                                                    onClick={() => setSelectedSparePartId(part.id.toString())}
                                                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                                        selectedSparePartId === part.id.toString() ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{part.part_name}</p>
                                                            <p className="text-sm text-gray-500">{part.part_number}</p>
                                                            {part.description && (
                                                                <p className="text-xs text-gray-400 mt-1">{part.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center text-gray-500">
                                                {searchTerm ? 'No parts found matching your search' : 'No spare parts available'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={partQuantity}
                                        onChange={e => setPartQuantity(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddPartModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedSparePartId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Part
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Part Quantity Modal */}
            {editingPart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Update Quantity</h3>
                            <button onClick={() => setEditingPart(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdatePart} className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Part</p>
                                <p className="font-medium text-gray-900">{editingPart.part_name}</p>
                                {editingPart.description && (
                                    <p className="text-xs text-gray-500 mt-1">{editingPart.description}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={editPartQuantity}
                                    onChange={e => setEditPartQuantity(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingPart(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Audit History Modal */}
            {showAuditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseAuditModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <History size={20} />
                                Indent History
                            </h3>
                            <button onClick={handleCloseAuditModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0">
                            <AuditTimeline
                                events={auditEvents}
                                loading={auditLoading}
                                error={auditError}
                                currentPage={auditPage}
                                totalPages={auditTotalPages}
                                onPageChange={handleAuditPageChange}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IndentDetailPage;
