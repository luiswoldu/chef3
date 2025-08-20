'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface Step5Props {
  setTastePreference: (preference: string) => void;
  onNext: () => void;
}

const Step5: React.FC<Step5Props> = ({ setTastePreference, onNext }) => {
  const [selectedTaste, setSelectedTaste] = useState('');

  const tasteOptions = [
    { id: '1', label: 'Comfort Food', image: '/onboarding-option1.jpg' },
    { id: '2', label: 'Healthy & Fresh', image: '/onboarding-option2.jpg' },
    { id: '3', label: 'International', image: '/onboarding-option3.jpg' },
    { id: '4', label: 'Quick & Easy', image: '/onboarding-option4.jpg' }
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
          <h1 className="text-3xl font-extrabold tracking-tighter leading-none mb-2 text-black text-left">
          What's your go-to breakfast?
          </h1>
          <p className="text-base tracking-tight text-[#9F9F9F] mb-8">
            Your choice will help us understand your taste.  
          </p>
          
          <div className="grid grid-cols-2 gap-2 mb-8">
            {tasteOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelection(option.id)}
                className={`h-32 rounded-2xl transition-all duration-200 relative overflow-hidden ${
                  selectedTaste === option.id ? 'border-4 border-[#6CD401]' : 'border-4 border-transparent'
                }`}
              >
                <div className="absolute inset-0">
                  <Image
                    src={option.image}
                    alt={option.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                {selectedTaste === option.id && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <Check size={16} className="text-[#6CD401]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!selectedTaste}
          className={`w-full px-6 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium ${
            selectedTaste 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-[#F7F7F7] text-gray-700 hover:bg-gray-200'
          }`}
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default Step5;