import React from 'react';
import { Watch, Calendar } from 'lucide-react';
import CustomDatePicker from '../../common/CustomDatePicker';

const WatchStep = ({ formData, handleChange, brands }) => {
    const { watch } = formData;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Watch className="w-4 h-4 text-blue-600" />
                    Watch Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <select
                            name="brand_id"
                            value={watch.brand_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white"
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                        {/* Display Brand ID below the field */}
                        {watch.brand_id && (
                            <p className="mt-1 text-xs text-gray-500">
                                Selected Brand ID: <span className="font-mono font-medium text-blue-600">{watch.brand_id}</span>
                            </p>
                        )}
                    </div>

                    {/* Model Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model Number</label>
                        <input
                            type="text"
                            name="model_number"
                            value={watch.model_number}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="Submariner 126610LN"
                        />
                    </div>

                    {/* Watch Serial Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Watch Serial Number</label>
                        <input
                            type="text"
                            name="watch_serial_number"
                            value={watch.watch_serial_number}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="8-digit serial"
                        />
                    </div>

                    {/* Date of Purchase */}
                    <div>
                        <CustomDatePicker
                            label="Date of Purchase"
                            name="date_of_purchase"
                            value={watch.date_of_purchase}
                            onChange={handleChange}
                            placeholder="Select Date of Purchase"
                        />
                    </div>

                    {/* UCP Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UCP Rate</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="ucp_rate"
                                value={watch.ucp_rate}
                                onChange={handleChange}
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Other Remarks */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Remarks</label>
                        <textarea
                            name="other_remarks"
                            value={watch.other_remarks}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
                            placeholder="Any specific remarks about the watch..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WatchStep;
