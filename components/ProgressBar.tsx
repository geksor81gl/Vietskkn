
import React from 'react';
import { APP_STEPS } from '../constants';

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  return (
    <div className="mb-8 no-print">
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        {APP_STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;
          
          return (
            <div 
              key={step.id} 
              className={`flex-shrink-0 flex flex-col items-center w-24 transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-60'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
                isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 
                isDone ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {isDone ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.id}
              </div>
              <span className={`text-[10px] font-bold text-center uppercase tracking-tighter ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
        <div 
          className="bg-blue-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / APP_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
