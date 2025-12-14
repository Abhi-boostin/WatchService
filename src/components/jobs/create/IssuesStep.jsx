import React from 'react';
import { ClipboardList } from 'lucide-react';
import CustomDatePicker from '../../common/CustomDatePicker';
import HierarchicalNodeSelector from '../../common/HierarchicalNodeSelector';

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
