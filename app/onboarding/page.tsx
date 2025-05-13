'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingContainer from './components/OnboardingContainer';
import ProgressBar from './components/ProgressBar';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import Step5 from './components/Step5';

interface OnboardingData {
  firstName: string;
  username: string;
  email: string;
  password: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    username: '',
    email: '',
    password: '',
  });

  const totalSteps = 5;

  const handleNextStep = () => {
    if (step === totalSteps) {
      handleOnboardingComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      // Redirect to main app after successful signup in Step5
      router.push('/home');
    } catch (error) {
      console.error('Error during onboarding completion:', error);
    }
  };

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <OnboardingContainer>
      <ProgressBar step={step} totalSteps={totalSteps} />
      
      {step === 1 && (
        <Step1
          setFirstName={(name) => updateFormData('firstName', name)}
          onNext={handleNextStep}
        />
      )}
      
      {step === 2 && (
        <Step2
          setUsername={(username) => updateFormData('username', username)}
          onNext={handleNextStep}
        />
      )}
      
      {step === 3 && (
        <Step3
          setEmail={(email) => updateFormData('email', email)}
          onNext={handleNextStep}
        />
      )}
      
      {step === 4 && (
        <Step4
          setPassword={(password) => updateFormData('password', password)}
          onNext={handleNextStep}
        />
      )}
      
      {step === 5 && (
        <Step5 
          formData={formData}
          onComplete={handleOnboardingComplete} 
        />
      )}
    </OnboardingContainer>
  );
} 