'use client';

import React from 'react';

interface Step2Props {
  setUsername: (username: string) => void;
  onNext: () => void;
}

const Step2: React.FC<Step2Props> = ({ setUsername, onNext }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-2 text-black">
            Choose a username
          </h1>
          <input
            type="text"
            id="username"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
            placeholder="Enter your username"
            required
            pattern="^[a-zA-Z0-9_]{3,20}$"
            title="Username must be 3-20 characters long and can only contain letters, numbers, and underscores"
          />
          <p className="mt-2 text-sm text-gray-500">
            3-20 characters, letters, numbers, and underscores only
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

export default Step2; 