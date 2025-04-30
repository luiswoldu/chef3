import RecipeDetailClient from '@/components/RecipeDetailClient'

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RecipeDetailClient id={id} />
} 