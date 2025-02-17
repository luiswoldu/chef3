import RecipeDetailClient from '@/components/RecipeDetailClient'
import Image from 'next/image'

export async function generateStaticParams() {
  return Array.from({ length: 15 }, (_, i) => ({
    id: (i + 1).toString(),
  }))
}

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  return <RecipeDetailClient id={params.id} />
}

const Example = () => (
  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
    <Image src="/placeholder.svg" fill alt="Placeholder" />
  </div>
)

