import React from 'react';
import { X, Watch, Calendar } from 'lucide-react';

const WatchSelectionModal = ({ isOpen, onClose, watches, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Existing Watches Found</h3>
                        <p className="text-sm text-gray-500">This customer has serviced watches with us before.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Would you like to use details from a previous watch? Click to select.
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                        {watches.map((watch) => (
                            <div
                                key={watch.id}
                                onClick={() => onSelect(watch)}
                                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Watch size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-gray-900">
                                            {watch.brand?.name || `Brand ID: ${watch.brand_id}`}
                                        </h4>
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                            #{watch.watch_serial_number}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Model: {watch.model_number}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            Purchased: {watch.date_of_purchase ? new Date(watch.date_of_purchase).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        No, use new watch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WatchSelectionModal;
