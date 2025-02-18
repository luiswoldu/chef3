import RecipeDetailClient from '@/components/RecipeDetailClient'
import Image from 'next/image'

export async function generateStaticParams() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: (i + 1).toString(),
  }))
}

interface PageProps {
  params: {
    id: string
  }
}

export default function RecipeDetailPage({ params }: PageProps) {
  return <RecipeDetailClient id={params.id} />
}

