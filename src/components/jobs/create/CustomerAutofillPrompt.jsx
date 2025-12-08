import React from 'react';
import { User, Check, X } from 'lucide-react';

const CustomerAutofillPrompt = ({ customer, onConfirm, onCancel }) => {
    if (!customer) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slideIn">
            <div className="bg-white rounded-xl shadow-xl border border-blue-100 p-4 w-80 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Customer Found</h4>
                        <p className="text-sm text-gray-600">
                            We found <strong>{customer.name}</strong> with this number. Would you like to autofill their details?
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-1">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <X size={14} />
                        No
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                        <Check size={14} />
                        Yes, Autofill
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerAutofillPrompt;
