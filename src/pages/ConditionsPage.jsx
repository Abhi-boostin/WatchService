import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckSquare, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import api from '../services/api';

const ConditionsPage = () => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [formData, setFormData] = useState({
        label: '',
        code: '',
        parent_id: null,
        sort_order: 0,
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: ''
    });

    useEffect(() => {
        fetchNodes();
    }, []);

    const fetchNodes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/conditions/nodes');
            setNodes(response.data || []);
        } catch (error) {
            console.error("Error fetching condition nodes:", error);
            setNodes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parent_id: formData.parent_id || 0,
                effective_to: formData.effective_to || null
            };

            if (editingNode) {
                await api.patch(`/api/v1/conditions/nodes/${editingNode.id}`, payload);
            } else {
                await api.post('/api/v1/conditions/nodes', payload);
            }
            setShowModal(false);
            setEditingNode(null);
            resetForm();
            fetchNodes();
        } catch (error) {
            console.error("Error saving condition node:", error);
            alert("Failed to save condition node");
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            code: '',
            parent_id: null,
            sort_order: 0,
            effective_from: new Date().toISOString().split('T')[0],
            effective_to: ''
        });
    };

    const handleEdit = (node) => {
        setEditingNode(node);
        setFormData({
            label: node.label,
            code: node.code,
            parent_id: node.parent_id === 0 ? null : node.parent_id,
            sort_order: node.sort_order,
            effective_from: node.effective_from ? node.effective_from.split('T')[0] : '',
            effective_to: node.effective_to ? node.effective_to.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this condition node?')) {
            try {
                await api.delete(`/api/v1/conditions/nodes/${id}`);
                fetchNodes();
            } catch (error) {
                console.error("Error deleting condition node:", error);
                alert("Failed to delete condition node");
            }
        }
    };

    // Recursive component to render tree
    const TreeNode = ({ node, level = 0 }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className="border-b border-gray-100 last:border-0">
                <div
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${level > 0 ? 'bg-gray-50/30' : ''}`}
                    style={{ paddingLeft: `${level * 20 + 16}px` }}
                >
                    <div className="flex items-center gap-3">
                        {hasChildren ? (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 hover:bg-gray-200 rounded text-gray-500"
                            >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        ) : (
                            <div className="w-6" /> // Spacer
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <CheckSquare size={16} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{node.label}</h3>
                                <p className="text-xs text-gray-500">Code: {node.code}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(node)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(node.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map(child => (
                            <TreeNode key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Conditions</h1>
                    <p className="text-gray-500 mt-1">Manage watch condition checkpoints</p>
                </div>
                <button
                    onClick={() => {
                        setEditingNode(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors"
                >
                    <Plus size={20} />
                    Add Condition
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : nodes.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {nodes.map((node) => (
                        <TreeNode key={node.id} node={node} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No conditions found.</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            {editingNode ? 'Edit Condition' : 'Add New Condition'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Scratches on Case"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., CASE_SCRATCH"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                                    <input
                                        type="date"
                                        value={formData.effective_from}
                                        onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective To</label>
                                    <input
                                        type="date"
                                        value={formData.effective_to}
                                        onChange={e => setFormData({ ...formData, effective_to: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingNode ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionsPage;
