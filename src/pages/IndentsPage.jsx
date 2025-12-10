import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Package, Truck, Calendar, ChevronRight, Save, Trash2, Pencil, X } from 'lucide-react';
import api from '../services/api';

const IndentsPage = () => {
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Creation/Editing State
    const [step, setStep] = useState(1);
    const [jobs, setJobs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [createdIndent, setCreatedIndent] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const [indentForm, setIndentForm] = useState({
        job_id: '',
        supplier_id: '',
        serial_number: '',
        notes: ''
    });

    // Parts State
    const [parts, setParts] = useState([]); // Local state for parts added during this session
    const [newPart, setNewPart] = useState({ part_name: '', quantity: 1 });
    const [commonParts, setCommonParts] = useState([
        "Crown", "Glass/Crystal", "Battery", "Strap/Bracelet", "Movement", "Hands", "Dial", "Bezel", "Case Back", "Spring Bar"
    ]);
    const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchIndents();
        } else if (view === 'create') {
            fetchDependencies();
        }
    }, [view]);

    const fetchCommonParts = useCallback(async () => {
        try {
            const response = await api.get('/api/v1/spare-parts?page_size=100');
            const existingParts = response.data.items || response.data || [];
            const names = existingParts.map(p => p.part_name);
            setCommonParts(prev => [...new Set([...prev, ...names])]);
        } catch (error) {
            console.error("Error fetching parts:", error);
        }
    }, []);

    useEffect(() => {
        if (step === 2) {
            fetchCommonParts();
        }
    }, [step, fetchCommonParts]);

    const fetchIndents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/indents');
            setIndents(response.data.items || response.data || []);
        } catch (error) {
            console.error("Error fetching indents:", error);
            setIndents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDependencies = async () => {
        try {
            const [jobsRes, suppliersRes] = await Promise.all([
                api.get('/api/v1/jobs?status=booked'),
                api.get('/api/v1/suppliers')
            ]);

            const fetchedJobs = jobsRes.data.items || jobsRes.data || [];
            fetchedJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setJobs(fetchedJobs);
            setSuppliers(suppliersRes.data.items || suppliersRes.data || []);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
        }
    };

    const handleStartCreate = () => {
        setEditingId(null);
        setIndentForm({
            job_id: '',
            supplier_id: '',
            serial_number: `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            notes: ''
        });
        setParts([]);
        setStep(1);
        setView('create');
    };

    const handleStartEdit = (indent) => {
        setEditingId(indent.id);
        setIndentForm({
            job_id: indent.job_id,
            supplier_id: indent.supplier_id,
            serial_number: indent.serial_number,
            notes: indent.notes || ''
        });
        setParts([]); // We don't fetch existing parts yet
        setStep(1);
        setView('create');
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this indent?")) return;

        try {
            await api.delete(`/api/v1/indents/${id}`);
            setIndents(indents.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error deleting indent:", error);
            alert("Failed to delete indent");
        }
    };

    const handleSubmitIndent = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editingId) {
                // Update
                response = await api.patch(`/api/v1/indents/${editingId}`, {
                    job_id: indentForm.job_id,
                    supplier_id: indentForm.supplier_id,
                    notes: indentForm.notes
                });
            } else {
                // Create
                response = await api.post('/api/v1/indents', indentForm);
            }

            setCreatedIndent(response.data);
            setStep(2);
        } catch (error) {
            console.error("Error saving indent:", error);
            alert("Failed to save indent");
        }
    };

    const handleAddPart = async (e) => {
        e.preventDefault();
        if (!createdIndent) return;

        try {
            const payload = {
                indent_id: createdIndent.id,
                part_name: newPart.part_name,
                quantity: parseInt(newPart.quantity)
            };
            await api.post('/api/v1/spare-parts', payload);

            setParts([...parts, payload]);
            setNewPart({ part_name: '', quantity: 1 });
        } catch (error) {
            console.error("Error adding part:", error);
            alert("Failed to add part");
        }
    };

    const togglePartSelection = (partName) => {
        if (selectedTags.includes(partName)) {
            setSelectedTags(selectedTags.filter(t => t !== partName));
        } else {
            setSelectedTags([...selectedTags, partName]);
        }
    };

    const handleAddSelectedParts = async () => {
        if (!createdIndent || selectedTags.length === 0) return;

        try {
            const promises = selectedTags.map(partName =>
                api.post('/api/v1/spare-parts', {
                    indent_id: createdIndent.id,
                    part_name: partName,
                    quantity: 1
                })
            );

            await Promise.all(promises);

            const newParts = selectedTags.map(name => ({ part_name: name, quantity: 1 }));
            setParts([...parts, ...newParts]);
            setSelectedTags([]);
        } catch (error) {
            console.error("Error adding parts:", error);
            alert("Failed to add some parts");
        }
    };

    const handleFinish = () => {
        setView('list');
        setStep(1);
        setCreatedIndent(null);
        setEditingId(null);
        setParts([]);
    };

    if (view === 'create') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => setView('list')}
                        className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1"
                    >
                        &larr; Back to Indents
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {editingId ? 'Edit Indent' : 'Create New Indent'}
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                            Indent Details
                        </div>
                        <div className="w-12 h-0.5 bg-gray-200"></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                            Add Spare Parts
                        </div>
                    </div>
                </div>

                {step === 1 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <form onSubmit={handleSubmitIndent} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Job (Booked)</label>
                                    <select
                                        required
                                        value={indentForm.job_id}
                                        onChange={e => setIndentForm({ ...indentForm, job_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a Job</option>
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                {job.job_number || `Job #${job.id}`} - Customer #{job.customer_id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Supplier</label>
                                    <select
                                        required
                                        value={indentForm.supplier_id}
                                        onChange={e => setIndentForm({ ...indentForm, supplier_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a Supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingId} // Disable serial number editing if it's an update
                                        value={indentForm.serial_number}
                                        onChange={e => setIndentForm({ ...indentForm, serial_number: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${editingId ? 'bg-gray-100 text-gray-500' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <input
                                        type="text"
                                        value={indentForm.notes}
                                        onChange={e => setIndentForm({ ...indentForm, notes: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Need crown and glass"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    {editingId ? 'Update & Continue' : 'Create & Continue'} <ChevronRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-blue-900">Indent #{createdIndent?.serial_number} {editingId ? 'Updated' : 'Created'}</h3>
                                <p className="text-sm text-blue-700">Now add the spare parts required for this order.</p>
                            </div>
                            <div className="text-right text-sm text-blue-800">
                                <p>Job ID: {createdIndent?.job_id}</p>
                                <p>Supplier ID: {createdIndent?.supplier_id}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Select Spare Parts</h3>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {commonParts.map(part => (
                                    <button
                                        key={part}
                                        onClick={() => togglePartSelection(part)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.includes(part)
                                                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {part}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">
                                        {selectedTags.length} parts selected. (Default Quantity: 1)
                                    </p>
                                </div>
                                <button
                                    onClick={handleAddSelectedParts}
                                    disabled={selectedTags.length === 0}
                                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={18} /> Add Selected
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-2">Or add custom part:</p>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            required
                                            value={newPart.part_name}
                                            onChange={e => setNewPart({ ...newPart, part_name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Custom Part Name"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={newPart.quantity}
                                            onChange={e => setNewPart({ ...newPart, quantity: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Qty"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddPart}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Add Custom
                                    </button>
                                </div>
                            </div>
                        </div>

                        {parts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-medium text-gray-900">Added Parts (This Session)</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {parts.map((part, index) => (
                                        <div key={index} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                                    <Package size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{part.part_name}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">Qty: {part.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleFinish}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} /> Finish
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Indents</h1>
                    <p className="text-gray-500 mt-1">Manage spare parts orders</p>
                </div>
                <button
                    onClick={handleStartCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                    <Plus size={20} />
                    Create Indent
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : indents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {indents.map((indent) => (
                        <div key={indent.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleStartEdit(indent)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Indent"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(indent.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Indent"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{indent.serial_number}</h3>
                                        <p className="text-sm text-gray-500">Job #{indent.job_id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Truck size={14} className="text-gray-400" />
                                    Supplier #{indent.supplier_id}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(indent.created_at || Date.now()).toLocaleDateString()}
                                </div>
                                {indent.notes && (
                                    <p className="text-gray-500 italic mt-2">"{indent.notes}"</p>
                                )}
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                                    Indented
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No indents found.</p>
                </div>
            )}
        </div>
    );
};

export default IndentsPage;
