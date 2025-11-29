'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingContainerProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

const OnboardingContainer: React.FC<OnboardingContainerProps> = ({ children, currentStep, totalSteps, onBack }) => {
  const router = useRouter();

  const handleBack = () => {
    if (currentStep === 1) {
      router.push('/');
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {currentStep !== totalSteps && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <div className="flex-1 flex flex-col items-center p-4 pt-8">
        {children}
      </div>
    </div>
  );
};

export default OnboardingContainer;