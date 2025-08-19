'use client';

import React from 'react';

interface Step3Props {
  setEmail: (email: string) => void;
  onNext: () => void;
}

const Step3: React.FC<Step3Props> = ({ setEmail, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-2 text-black">
            What's your email?
          </h1>
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
            placeholder="Enter your email"
            required
          />
          <p className="mt-2 text-sm tracking-tight text-gray-500">
            We'll never share your email with anyone else. 
          </p>
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

export default Step3; 