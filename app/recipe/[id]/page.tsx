import dynamic from 'next/dynamic'

const RecipeDetailClient = dynamic(() => import('@/components/RecipeDetailClient'), {
  ssr: false
})

type Props = {
  params: {
    id: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function RecipePage({ params }: Props) {
  return <RecipeDetailClient id={params.id} />
} 