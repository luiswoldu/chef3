'use client';

import React, { useState } from 'react';

interface Step5Props {
  setTastePreference: (preference: string) => void;
  onNext: () => void;
}

const Step5: React.FC<Step5Props> = ({ setTastePreference, onNext }) => {
  const [selectedTaste, setSelectedTaste] = useState('');

  const tasteOptions = [
    { id: 'comfort', label: 'Comfort Food' },
    { id: 'healthy', label: 'Healthy & Fresh' },
    { id: 'international', label: 'International' },
    { id: 'quick', label: 'Quick & Easy' }
  ];

  const handleSelection = (tasteId: string) => {
    setSelectedTaste(tasteId);
    setTastePreference(tasteId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTaste) {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-8 text-black text-left">
            Which one best describes your taste?
          </h1>
          
          <div className="grid grid-cols-2 gap-2 mb-8">
            {tasteOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelection(option.id)}
                className={`
                  h-24 rounded-2xl transition-all duration-200 flex items-center justify-center
                  ${selectedTaste === option.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-[#F7F7F7] text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="text-sm font-medium text-center px-2">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!selectedTaste}
          className="w-full bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default Step5;