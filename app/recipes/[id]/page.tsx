import RecipeDetailClient from '@/components/RecipeDetailClient'
import Image from 'next/image'

// Add logging for debugging
console.log('Page Component Structure:', {
  nextVersion: '15.1.6',
  fileStructure: __filename,
  moduleType: typeof module !== 'undefined' ? 'CommonJS' : 'ESM'
});

export async function generateStaticParams() {
  console.log('generateStaticParams called');
  return Array.from({ length: 15 }, (_, i) => ({
    id: (i + 1).toString(),
  }))
}

export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  console.log('RecipeDetailPage Props:', JSON.stringify(params, null, 2));
  console.log('Params Type:', typeof params);
  console.log('Is Promise:', params instanceof Promise);
  
  return <RecipeDetailClient id={params.id} />
}