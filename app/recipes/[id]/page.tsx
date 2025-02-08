'use client'

import RecipeDetailClient from '@/components/RecipeDetailClient'
import Image from 'next/image'

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const resolvedParams = await params;
  return <RecipeDetailClient id={resolvedParams.id} />
}

const Example = () => (
  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
    <Image src="/placeholder.svg" fill alt="Placeholder" />
  </div>
)

