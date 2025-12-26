import RecipeDetailClient from '@/components/RecipeDetailClient'

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <RecipeDetailClient id={resolvedParams.id} />
}
