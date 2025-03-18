"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AddTestRecipePage() {
  const [status, setStatus] = useState("Preparing to add recipe...")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function addTestRecipe() {
      try {
        setStatus("Calling API to add Beef Stir Fry recipe...")
        
        // Call our API endpoint
        const response = await fetch('/api/add-test-recipe');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to add recipe');
        }
        
        setResult(data);
        setStatus(`Recipe added successfully with ID: ${data.recipeId}. Redirecting to home...`);
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/')
        }, 2000);
        
      } catch (err: any) {
        console.error('Error adding test recipe:', err);
        setError(err.message || 'An unknown error occurred');
        setStatus("Failed to add recipe");
      }
    }

    addTestRecipe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Adding Test Recipe</h1>
        <div className="mb-4">
          <p className="text-gray-700">{status}</p>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
          {result && (
            <div className="mt-4 p-4 bg-green-100 rounded">
              <p className="text-green-800">Recipe added successfully!</p>
              <p className="text-sm mt-2">Recipe ID: {result.recipeId}</p>
              <Link href="/" className="text-blue-500 hover:underline block mt-2">
                Return to Home
              </Link>
            </div>
          )}
        </div>
        {!error && !result && (
          <div className="animate-pulse mt-4">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded mt-2"></div>
            <div className="h-2 bg-gray-200 rounded mt-2 w-3/4"></div>
          </div>
        )}
      </div>
    </div>
  );
} 