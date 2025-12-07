import React, { useState } from 'react';
import { Check, User, Watch, ClipboardList, Camera } from 'lucide-react';

const steps = [
    { id: 1, title: 'Customer', icon: User },
    { id: 2, title: 'Watch Details', icon: Watch },
    { id: 3, title: 'Issues', icon: ClipboardList },
    { id: 4, title: 'Images', icon: Camera },
];

const CreateJobPage = () => {
    const [currentStep, setCurrentStep] = useState(1);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
                <p className="text-gray-500 mt-1">Create a new service job card</p>
            </div>

            {/* Stepper */}
            <div className="mb-12">
                <div className="relative flex items-center justify-between w-full">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                    <div
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            isCurrent ? 'bg-white border-gray-900 text-gray-900 scale-110' :
                                                'bg-white border-gray-300 text-gray-300'}
                  `}
                                >
                                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                </div>
                                <span
                                    className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${isCurrent ? 'text-gray-900' : 'text-gray-400'}
                  `}
                                >
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] p-8">
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>Step {currentStep} Content</p>
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                            className="px-6 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                            disabled={currentStep === 4}
                            className="px-6 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateJobPage;
