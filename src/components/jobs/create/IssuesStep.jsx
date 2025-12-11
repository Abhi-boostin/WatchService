import React from 'react';
import { ClipboardList } from 'lucide-react';
import CustomDatePicker from '../../common/CustomDatePicker';

const ConditionNode = ({ node, level = 0, selectedIds, onToggle }) => {
    const isSelected = selectedIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (hasChildren) {
        return (
            <div className={`ml-${level * 4} mb-2`}>
                <div className="p-2">
                    <span className={`text-sm font-semibold text-gray-900`}>
                        {node.label}
                    </span>
                </div>
                <div className="ml-6 mt-1 border-l-2 border-gray-100 pl-2">
                    {node.children.map(child => (
                        <ConditionNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`ml-${level * 4} mb-2`}>
            <label className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'} border border-transparent`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(node.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                    {node.label}
                </span>
            </label>
        </div>
    );
};

const IssuesStep = ({ formData, handleChange, conditionNodes, complaintNodes, handleConditionToggle, handleComplaintToggle, onCalculateCost, costBreakdown, isCalculating }) => {
    const { issues } = formData;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Service Requirements & Conditions
                </h3>

                <div className="space-y-6">
                    {/* Condition Tree */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Watch Conditions & Issues</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
                            {conditionNodes && conditionNodes.map(node => (
                                <ConditionNode
                                    key={node.id}
                                    node={node}
                                    selectedIds={issues.condition_node_ids}
                                    onToggle={handleConditionToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Complaints Tree */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Customer Complaints</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
                            {complaintNodes && complaintNodes.map(node => (
                                <ConditionNode
                                    key={node.id}
                                    node={node}
                                    selectedIds={issues.complaint_node_ids || []}
                                    onToggle={handleComplaintToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Other Issues */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Observations / Notes</label>
                        <textarea
                            name="other_issue"
                            value={issues.other_issue}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
                            placeholder="Specific customer complaints or technician observations..."
                        />
                    </div>

                    {/* Cost Calculation Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-medium text-gray-700">Cost Estimation</h4>
                            <button
                                type="button"
                                onClick={onCalculateCost}
                                disabled={isCalculating}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isCalculating ? 'Calculating...' : 'Calculate Estimate'}
                            </button>
                        </div>

                        {costBreakdown && (
                            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Total Estimate</span>
                                        <span className="text-lg font-bold text-blue-700">₹{parseFloat(costBreakdown.estimated_total).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Labour Cost</span>
                                        <span className="text-sm font-medium text-gray-900">₹{parseFloat(costBreakdown.total_labour_cost).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Parts Cost</span>
                                        <span className="text-sm font-medium text-gray-900">₹{parseFloat(costBreakdown.total_parts_cost).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide block mb-1">UCP Rate</span>
                                        <span className="text-sm font-medium text-gray-900">₹{parseFloat(costBreakdown.ucp_rate).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Estimated Cost */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="estimated_cost"
                                    value={issues.estimated_cost}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Estimated Delivery */}
                        <div>
                            <CustomDatePicker
                                label="Estimated Delivery"
                                name="estimated_delivery"
                                value={issues.estimated_delivery}
                                onChange={handleChange}
                                placeholder="Select Delivery Date"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssuesStep;
