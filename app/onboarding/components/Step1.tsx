'use client';

import React from 'react';

interface Step1Props {
  setFirstName: (name: string) => void;
  onNext: () => void;
}

const Step1: React.FC<Step1Props> = ({ setFirstName, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-2 text-black">
            What's your first name?
          </h1>
          <input
            type="text"
            id="firstName"
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
            placeholder="First name"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default Step1; 