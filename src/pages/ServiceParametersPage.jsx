import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckSquare, Plus, ChevronRight, ChevronDown, Folder, FileText, Loader2, Pencil, Trash2 } from 'lucide-react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errorUtils';

const NodeItem = ({ node, level = 0, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group ${level === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {hasChildren ? (
                    <span className="text-gray-400">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                ) : (
                    <span className="w-4" /> // Spacer
                )}

                {level === 0 ? (
                    <Folder size={18} className="text-blue-500" />
                ) : (
                    <FileText size={16} className="text-gray-400" />
                )}

                <span className="flex-1">{node.label}</span>
                {node.code && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">{node.code}</span>}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(node); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isOpen && hasChildren && (
                <div className="animate-fadeIn">
                    {node.children.map(child => (
                        <NodeItem key={child.id} node={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ServiceParametersPage = () => {
    const [activeTab, setActiveTab] = useState('complaints');
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [spareParts, setSpareParts] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        parent_id: '', // Empty string means root
        default_spare_part_id: '' // Only for complaints, leaf nodes
    });

    const fetchNodes = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'complaints' ? '/api/v1/complaints/nodes' : '/api/v1/conditions/nodes';
            const response = await api.get(endpoint);
            setNodes(response.data || []);
        } catch (error) {
            console.error(`Error fetching ${activeTab}:`, error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchNodes();
    }, [fetchNodes]);

    // Fetch spare parts for complaints tab
    useEffect(() => {
        const fetchSpareParts = async () => {
            if (activeTab === 'complaints') {
                try {
                    const response = await api.get('/api/v1/spare-parts/all');
                    setSpareParts(response.data || []);
                } catch (error) {
                    console.error("Error fetching spare parts:", error);
                }
            }
        };
        fetchSpareParts();
    }, [activeTab]);

    const handleSaveNode = async (e) => {
        e.preventDefault();
        try {
            const endpoint = activeTab === 'complaints' ? '/api/v1/complaints/nodes' : '/api/v1/conditions/nodes';
            const payload = {
                label: formData.label,
                parent_id: formData.parent_id ? parseInt(formData.parent_id) : null
            };

            // Add default_spare_part_id for complaints (only if provided)
            if (activeTab === 'complaints' && formData.default_spare_part_id) {
                payload.default_spare_part_id = parseInt(formData.default_spare_part_id);
            }

            if (selectedNode) {
                await api.patch(`${endpoint}/${selectedNode.id}`, payload);
            } else {
                await api.post(endpoint, payload);
            }

            fetchNodes();
            setShowModal(false);
            setFormData({ label: '', parent_id: '', default_spare_part_id: '' });
            setSelectedNode(null);
        } catch (error) {
            console.error("Error saving node:", error);
            alert(getErrorMessage(error, "Failed to save item"));
        }
    };

    const handleEditNode = (node) => {
        setSelectedNode(node);
        setFormData({
            label: node.label,
            parent_id: node.parent_id || '',
            default_spare_part_id: node.default_spare_part_id || ''
        });
        setShowModal(true);
    };

    const handleDeleteNode = async (node) => {
        if (!window.confirm(`Are you sure you want to delete "${node.label}"?`)) return;

        try {
            const endpoint = activeTab === 'complaints' ? `/api/v1/complaints/nodes/${node.id}` : `/api/v1/conditions/nodes/${node.id}`;
            await api.delete(endpoint);
            fetchNodes();
        } catch (error) {
            console.error("Error deleting node:", error);
            alert(getErrorMessage(error, "Failed to delete item"));
        }
    };

    const openCreateModal = () => {
        setSelectedNode(null);
        setFormData({ label: '', parent_id: '', default_spare_part_id: '' });
        setShowModal(true);
    };

    // Flatten nodes for parent selection dropdown
    const getAllPotentialParents = (nodesList) => {
        let parents = [];
        const traverse = (list) => {
            list.forEach(node => {
                parents.push(node);
                if (node.children) traverse(node.children);
            });
        };
        traverse(nodesList);
        return parents;
    };

    const potentialParents = getAllPotentialParents(nodes);

    // Check if selected node would be a leaf node (no children)
    const wouldBeLeafNode = () => {
        if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
            return false; // Editing existing node with children
        }
        // For new nodes or nodes without children, it's a leaf
        return true;
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Service Parameters</h1>
                <p className="text-gray-500 mt-1">Manage complaints and condition checklists</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('complaints')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'complaints' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <AlertTriangle size={18} />
                        Customer Complaints
                    </button>
                    <button
                        onClick={() => setActiveTab('conditions')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'conditions' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <CheckSquare size={18} />
                        Watch Conditions
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Showing {nodes.length} root items
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-lg hover:bg-[#1E293B] transition-colors shadow-sm text-sm font-medium"
                    >
                        <Plus size={16} />
                        Add {activeTab === 'complaints' ? 'Complaint' : 'Condition'}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500">No items found. Create one to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {nodes.map(node => (
                                <NodeItem key={node.id} node={node} onEdit={handleEditNode} onDelete={handleDeleteNode} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                {selectedNode ? 'Edit' : 'Add New'} {activeTab === 'complaints' ? 'Complaint' : 'Condition'}
                            </h3>
                        </div>
                        <form onSubmit={handleSaveNode} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Label / Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                                    placeholder="e.g. Movement, Scratches"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category (Optional)</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none bg-white"
                                >
                                    <option value="">None (Create as Main Heading)</option>
                                    {potentialParents
                                        .filter(p => p.parent_id === null && (!selectedNode || p.id !== selectedNode.id)) // Simple cycle prevention: can't be own parent. Ideally should also exclude descendants.
                                        .map(node => (
                                            <option key={node.id} value={node.id}>
                                                {node.label}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select a parent to create a subheading, or leave empty for a main heading.
                                </p>
                            </div>
                            {/* Default Spare Part (Complaints Only, Leaf Nodes Only) */}
                            {activeTab === 'complaints' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Spare Part (Optional)
                                    </label>
                                    <select
                                        value={formData.default_spare_part_id}
                                        onChange={e => setFormData({ ...formData, default_spare_part_id: e.target.value })}
                                        disabled={!wouldBeLeafNode()}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">None</option>
                                        {spareParts.map(part => (
                                            <option key={part.id} value={part.id}>
                                                {part.part_name}
                                                {part.estimated_delivery_days ? ` - ${part.estimated_delivery_days} days` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {!wouldBeLeafNode() ? (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertTriangle size={12} />
                                            Only leaf nodes (without children) can have default spare parts
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Auto-select this spare part when users log this complaint
                                        </p>
                                    )}
                                </div>
                            )}
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
                                    {selectedNode ? 'Save Changes' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceParametersPage;
