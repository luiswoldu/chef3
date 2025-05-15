"use client"

import { useState, useEffect, MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import type { Recipe } from "@/types"

interface Ingredient {
  ingredient: string
  amount: string
  details: string
}

interface RecipeCardProps {
  id: string
  title: string
  image: string
  isHero?: boolean
  backgroundColor?: string
  showAddButton?: boolean
  cardType: 'hero' | 'square' | 'thumbnail'
}

export default function RecipeCard({
  id,
  title,
  image,
  isHero = false,
  backgroundColor = "#f3f4f6", // default gray-100
  showAddButton = true,
  cardType = 'square', // default to square if not specified
}: RecipeCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const imageSrc = image && image.trim() !== "" ? image : "/placeholder2.jpg"

  useEffect(() => {
    checkIfAdded()
  }, [])

  const checkIfAdded = async () => {
    try {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error checking recipe:', error)
        return
      }
      
      setIsAdded(!!recipe)
    } catch (error) {
      console.error('Error in checkIfAdded:', error)
    }
  }

  const addToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('recipes')
        .insert([{ id: Number(id), title, image }])
      
      if (error) {
        console.error('Error adding recipe:', error)
        return
      }
      
      setIsAdded(true)
    } catch (error) {
      console.error('Error in addToCart:', error)
    }
  }

  const getCardStyles = () => {
    switch (cardType) {
      case 'hero':
        return 'w-full h-full'
      case 'thumbnail':
        return 'max-w-sm aspect-[1/2]' // 2:1 aspect ratio for thumbnails
      case 'square':
        return 'max-w-sm aspect-square' // 1:1 aspect ratio for square cards
      default:
        return 'max-w-sm aspect-square'
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${getCardStyles()}`}
      style={{ backgroundColor }}
    >
      <Link href={`/recipe/${id}`} className="block w-full h-full">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-transform duration-300 ease-in-out transform hover:scale-105 ${
            cardType === 'thumbnail' ? 'object-center' : 'object-cover'
          }`}
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png"
          }}
        />
        <div className="absolute inset-0 flex items-end justify-start">
          <h2 
            className={`text-white leading-[1.1] ${
              cardType === 'hero' 
                ? 'text-[28px] tracking-[-0.04em] font-extrabold' 
                : cardType === 'thumbnail'
                ? 'text-base font-bold'
                : 'text-lg font-bold'
            } px-4 py-3 w-full`}
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            {title}
          </h2>
        </div>
      </Link>
      {showAddButton && (
        <button
          className={`absolute ${isHero ? 'bottom-4' : 'top-4'} right-4 bg-white rounded-full p-1 shadow-md hover:shadow-lg transition-shadow duration-300`}
          onClick={addToCart}
          aria-label={isAdded ? "Added to cart" : "Add to cart"}
        >
          {isAdded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

