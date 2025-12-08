import React from 'react';
import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep }) => {
    return (
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
    );
};

export default StepIndicator;
