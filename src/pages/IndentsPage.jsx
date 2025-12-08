import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Package, Truck, Calendar, ChevronRight, Save, Trash2 } from 'lucide-react';
import api from '../services/api';

const IndentsPage = () => {
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [indents, setIndents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Creation State
    const [step, setStep] = useState(1);
    const [jobs, setJobs] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [createdIndent, setCreatedIndent] = useState(null);
    const [indentForm, setIndentForm] = useState({
        job_id: '',
        supplier_id: '',
        serial_number: `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        notes: ''
    });
    const [parts, setParts] = useState([]);
    const [newPart, setNewPart] = useState({ part_name: '', quantity: 1 });

    useEffect(() => {
        if (view === 'list') {
            fetchIndents();
        } else if (view === 'create') {
            fetchDependencies();
        }
    }, [view]);

    const fetchIndents = async () => {
        setLoading(true);
        try {
            // Assuming GET /api/v1/indents exists
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
                api.get('/api/v1/jobs?status=booked'), // Assuming filter exists
                api.get('/api/v1/suppliers')
            ]);
            setJobs(jobsRes.data.items || jobsRes.data || []);
            setSuppliers(suppliersRes.data.items || suppliersRes.data || []);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
        }
    };

    const handleCreateIndent = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/v1/indents', indentForm);
            setCreatedIndent(response.data);
            setStep(2);
        } catch (error) {
            console.error("Error creating indent:", error);
            alert("Failed to create indent");
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

            // Add to local list for display
            setParts([...parts, payload]);
            setNewPart({ part_name: '', quantity: 1 });
        } catch (error) {
            console.error("Error adding part:", error);
            alert("Failed to add part");
        }
    };

    const handleFinish = () => {
        setView('list');
        setStep(1);
        setCreatedIndent(null);
        setParts([]);
        setIndentForm({
            job_id: '',
            supplier_id: '',
            serial_number: `IND-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            notes: ''
        });
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
                    <h1 className="text-2xl font-bold text-gray-900">Create New Indent</h1>
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
                        <form onSubmit={handleCreateIndent} className="space-y-6">
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
                                                Job #{job.job_id} - {job.customer?.name || 'Unknown Customer'}
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
                                        value={indentForm.serial_number}
                                        onChange={e => setIndentForm({ ...indentForm, serial_number: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    Create & Continue <ChevronRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-blue-900">Indent #{createdIndent?.serial_number} Created</h3>
                                <p className="text-sm text-blue-700">Now add the spare parts required for this order.</p>
                            </div>
                            <div className="text-right text-sm text-blue-800">
                                <p>Job ID: {createdIndent?.job_id}</p>
                                <p>Supplier ID: {createdIndent?.supplier_id}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Add Spare Part</h3>
                            <form onSubmit={handleAddPart} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPart.part_name}
                                        onChange={e => setNewPart({ ...newPart, part_name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Crown, Glass/Crystal"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={newPart.quantity}
                                        onChange={e => setNewPart({ ...newPart, quantity: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={18} /> Add
                                </button>
                            </form>
                        </div>

                        {parts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-medium text-gray-900">Added Parts</h3>
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
                                <Save size={18} /> Finish Indent
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
                    onClick={() => setView('create')}
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
                        <div key={indent.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
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
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                                    Indented
                                </span>
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
