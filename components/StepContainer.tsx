
import React from 'react';

interface StepContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const StepContainer: React.FC<StepContainerProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};

export default StepContainer;
