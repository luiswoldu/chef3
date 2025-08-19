'use client';

import React, { useState } from 'react';

interface Step4Props {
  setPassword: (password: string) => void;
  onNext: () => void;
}

const Step4: React.FC<Step4Props> = ({ setPassword, onNext }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = form.password.value;

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPassword(password);
    onNext();
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter mb-2 text-black">
            Create a password
          </h1>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="w-full px-4 py-3 rounded-2xl bg-[#F7F7F7] text-black/30 placeholder:text-black/30 focus:text-black text-lg"
              placeholder="Enter your password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {passwordError && (
            <p className="text-sm text-red-500 mt-2">{passwordError}</p>
          )}
          <p className="mt-2 text-sm tracking-tight text-gray-500">
            Password must be at least 8 characters long.
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

export default Step4; 