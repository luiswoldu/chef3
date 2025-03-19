import RecipeDetailClient from '@/components/RecipeDetailClient'

interface PageProps {
  params: {
    id: string
  }
}

export default function RecipePage({ params }: PageProps) {
  return <RecipeDetailClient id={params.id} />
} 