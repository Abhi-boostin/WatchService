import React, { useEffect } from 'react';
import { ClipboardList, Package, Clock } from 'lucide-react';
import CustomDatePicker from '../../common/CustomDatePicker';
import HierarchicalNodeSelector from '../../common/HierarchicalNodeSelector';

const IssuesStep = ({ formData, handleChange, conditionNodes, complaintNodes, spareParts = [], handleConditionToggle, handleComplaintToggle, handleComplaintSparePartChange, onCalculateCost, costBreakdown, isCalculating }) => {
    const { issues } = formData;

    // Helper function to find complaint node by ID
    const findComplaintNode = (nodes, targetId) => {
        for (const node of nodes) {
            if (node.id === targetId) return node;
            if (node.children) {
                const found = findComplaintNode(node.children, targetId);
                if (found) return found;
            }
        }
        return null;
    };

    // Auto-populate default spare parts when complaints are selected
    useEffect(() => {
        if (!handleComplaintSparePartChange) return;

        const selectedComplaints = issues.complaint_node_ids || [];
        
        selectedComplaints.forEach(complaintId => {
            const complaintNode = findComplaintNode(complaintNodes, complaintId);
            const existingMetadata = issues.complaint_spare_parts?.[complaintId];
            
            // Only auto-populate if no metadata exists yet AND complaint has default spare part
            if (!existingMetadata && complaintNode?.default_spare_part_id) {
                handleComplaintSparePartChange(complaintId, 'indent_required', true);
                handleComplaintSparePartChange(complaintId, 'spare_part_id', complaintNode.default_spare_part_id);
            }
        });
    }, [issues.complaint_node_ids, complaintNodes]);

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Service Requirements & Conditions
                </h3>

                <div className="space-y-6">
                    {/* Condition Tree */}
                    <HierarchicalNodeSelector
                        nodes={conditionNodes}
                        selectedIds={issues.condition_node_ids}
                        onToggle={handleConditionToggle}
                        label="Watch Conditions & Issues"
                        emptyMessage="No conditions available"
                    />

                    {/* Complaints Tree */}
                    <HierarchicalNodeSelector
                        nodes={complaintNodes}
                        selectedIds={issues.complaint_node_ids || []}
                        onToggle={handleComplaintToggle}
                        label="Customer Complaints"
                        emptyMessage="No complaints available"
                    />

                    {/* Spare Parts Metadata for Selected Complaints */}
                    {issues.complaint_node_ids && issues.complaint_node_ids.length > 0 && handleComplaintSparePartChange && (
                        <div className="mt-6 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" />
                                Spare Parts Requirements
                            </h4>
                            {issues.complaint_node_ids.map(complaintId => {
                                const complaintNode = findComplaintNode(complaintNodes, complaintId);
                                const metadata = issues.complaint_spare_parts?.[complaintId] || {};
                                const selectedSparePart = spareParts.find(sp => sp.id === metadata.spare_part_id);
                                
                                if (!complaintNode) return null;

                                return (
                                    <div key={complaintId} className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900">
                                                    {complaintNode.parent_label ? `${complaintNode.parent_label} - ` : ''}
                                                    {complaintNode.label}
                                                </h5>
                                                {complaintNode.default_spare_part && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        Default: {complaintNode.default_spare_part.part_name}
                                                        {complaintNode.default_spare_part.estimated_delivery_days && 
                                                            ` (${complaintNode.default_spare_part.estimated_delivery_days} days)`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {/* Checkbox: Indent Required */}
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={metadata.indent_required || false}
                                                    onChange={(e) => handleComplaintSparePartChange(complaintId, 'indent_required', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    This complaint requires ordering spare parts
                                                </span>
                                            </label>

                                            {/* Spare Part Dropdown (shown when indent_required is true) */}
                                            {metadata.indent_required && (
                                                <div className="pl-6 space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Select Spare Part
                                                    </label>
                                                    <select
                                                        value={metadata.spare_part_id || ''}
                                                        onChange={(e) => handleComplaintSparePartChange(complaintId, 'spare_part_id', e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none bg-white text-sm"
                                                    >
                                                        <option value="">Select a spare part...</option>
                                                        {spareParts.map(part => (
                                                            <option key={part.id} value={part.id}>
                                                                {part.part_name}
                                                                {part.estimated_delivery_days ? ` - ${part.estimated_delivery_days} days` : ''}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Show delivery estimate for selected part */}
                                                    {selectedSparePart && selectedSparePart.estimated_delivery_days && (
                                                        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                                            <Clock size={14} />
                                                            <span>Estimated delivery: {selectedSparePart.estimated_delivery_days} days</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Overall delivery estimate */}
                            {(() => {
                                const maxDelivery = Math.max(
                                    0,
                                    ...issues.complaint_node_ids.map(cid => {
                                        const metadata = issues.complaint_spare_parts?.[cid];
                                        if (!metadata?.indent_required || !metadata?.spare_part_id) return 0;
                                        const part = spareParts.find(sp => sp.id === metadata.spare_part_id);
                                        return part?.estimated_delivery_days || 0;
                                    })
                                );

                                if (maxDelivery > 0) {
                                    return (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                            <Clock size={16} className="text-amber-600" />
                                            <span className="text-sm font-medium text-amber-900">
                                                Maximum estimated delivery time: {maxDelivery} days
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    )}

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
                            <div className="space-y-3">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
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
                                
                                {/* Delivery Estimate */}
                                {costBreakdown.max_estimated_delivery_days && costBreakdown.max_estimated_delivery_days > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                        <Clock size={16} className="text-amber-600" />
                                        <span className="text-sm font-medium text-amber-900">
                                            Estimated delivery time: {costBreakdown.max_estimated_delivery_days} days
                                        </span>
                                        <span className="text-xs text-amber-600">(based on spare parts)</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cost Breakdown Section */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Cost Details</h4>
                        
                        <div className="space-y-4">
                            {/* Base Costs (from calculation) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Parts Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            name="estimated_parts_cost"
                                            value={issues.estimated_parts_cost || ''}
                                            onChange={handleChange}
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Labour Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            name="estimated_labour_cost"
                                            value={issues.estimated_labour_cost || ''}
                                            onChange={handleChange}
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Charges */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-green-700 mb-2">Additional Charges</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                name="additional_charge"
                                                value={issues.additional_charge || ''}
                                                onChange={handleChange}
                                                step="0.01"
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-green-200 bg-green-50/30 focus:ring-2 focus:ring-green-100 focus:border-green-600 transition-all outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Additional Charge</label>
                                        <input
                                            type="text"
                                            name="additional_charge_note"
                                            value={issues.additional_charge_note || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                            placeholder="e.g., Express service, Weekend work"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-red-700 mb-2">Deductions</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                name="deduction"
                                                value={issues.deduction || ''}
                                                onChange={handleChange}
                                                step="0.01"
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-red-200 bg-red-50/30 focus:ring-2 focus:ring-red-100 focus:border-red-600 transition-all outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deduction</label>
                                        <input
                                            type="text"
                                            name="deduction_note"
                                            value={issues.deduction_note || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                            placeholder="e.g., Customer discount, Loyalty benefit"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Final Total */}
                            <div className="pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-700">Final Estimated Total</span>
                                    <span className="text-2xl font-bold text-blue-700">
                                        ₹{(
                                            (parseFloat(issues.estimated_parts_cost) || 0) +
                                            (parseFloat(issues.estimated_labour_cost) || 0) +
                                            (parseFloat(issues.additional_charge) || 0) -
                                            (parseFloat(issues.deduction) || 0)
                                        ).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Estimated Delivery */}
                            <div className="pt-4">
                                <CustomDatePicker
                                    label="Estimated Delivery Date"
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
        </div>
    );
};

export default IssuesStep;
