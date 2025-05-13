'use client';

import React from 'react';

interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ step, totalSteps }) => {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mb-8 px-20">
      <div className="h-2 bg-[#F7F7F7] rounded-full">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(to right, #6ED308, #A5E765)'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 