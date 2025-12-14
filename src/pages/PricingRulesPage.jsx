import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorUtils';

const PricingRulesPage = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [complaintNodes, setComplaintNodes] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [selectedRule, setSelectedRule] = useState(null);
    const [formData, setFormData] = useState({
        complaint_node_id: '',
        price_percentage: '',
        labour_percentage: ''
    });

    useEffect(() => {
        fetchRules();
        fetchComplaintNodes();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/pricing-rules?page_size=100');
            setRules(response.data.items || []);
        } catch (error) {
            console.error("Error fetching pricing rules:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComplaintNodes = async () => {
        try {
            const response = await api.get('/api/v1/complaints/nodes');
            // Only use root nodes, ignore children
            const rootNodes = (response.data || []).map(node => ({
                id: node.id,
                label: node.label,
                level: 0
            }));
            setComplaintNodes(rootNodes);
        } catch (error) {
            console.error("Error fetching complaint nodes:", error);
        }
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            complaint_node_id: '',
            price_percentage: '',
            labour_percentage: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (rule) => {
        setModalMode('edit');
        setSelectedRule(rule);
        setFormData({
            complaint_node_id: rule.complaint_node_id,
            price_percentage: rule.price_percentage,
            labour_percentage: rule.labour_percentage
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                price_percentage: parseFloat(formData.price_percentage),
                labour_percentage: parseFloat(formData.labour_percentage)
            };

            if (modalMode === 'create') {
                payload.complaint_node_id = parseInt(formData.complaint_node_id);
                await api.post('/api/v1/pricing-rules', payload);
            } else {
                await api.patch(`/api/v1/pricing-rules/${selectedRule.id}`, payload);
            }

            fetchRules();
            setShowModal(false);
        } catch (error) {
            console.error("Error saving pricing rule:", error);
            alert(getErrorMessage(error, "Failed to save pricing rule. It might already exist for this complaint."));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this pricing rule?")) return;
        try {
            await api.delete(`/api/v1/pricing-rules/${id}`);
            fetchRules();
        } catch (error) {
            console.error("Error deleting pricing rule:", error);
            alert(getErrorMessage(error, "Failed to delete pricing rule"));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pricing Rules</h1>
                    <p className="text-gray-500 mt-1">Manage automated pricing logic for complaints</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                    <Plus size={20} />
                    Add Rule
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Complaint</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price %</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Labour %</th>
                            <th className="sticky right-0 bg-gray-50/50 px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : rules.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No pricing rules defined.</td>
                            </tr>
                        ) : (
                            rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-medium text-gray-900">{rule.complaint_node_label || `Node #${rule.complaint_node_id}`}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {rule.price_percentage}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {rule.labour_percentage}%
                                    </td>
                                    <td className="sticky right-0 bg-white group-hover:bg-gray-50/50 px-6 py-4 whitespace-nowrap text-right shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(rule)}
                                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                                                title="Edit Rule"
                                                aria-label="Edit pricing rule"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rule.id)}
                                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                                                title="Delete Rule"
                                                aria-label="Delete pricing rule"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalMode === 'create' ? 'Add Pricing Rule' : 'Edit Pricing Rule'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Node</label>
                                <select
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={formData.complaint_node_id}
                                    onChange={e => setFormData({ ...formData, complaint_node_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select Complaint</option>
                                    {complaintNodes.map(node => (
                                        <option key={node.id} value={node.id}>
                                            {'\u00A0'.repeat(node.level * 4)}{node.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price %</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price_percentage}
                                            onChange={e => setFormData({ ...formData, price_percentage: e.target.value })}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Labour %</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.labour_percentage}
                                            onChange={e => setFormData({ ...formData, labour_percentage: e.target.value })}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                    </div>
                                </div>
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
                                    Save Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingRulesPage;
