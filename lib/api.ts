interface ApiRecipe {
  idMeal: string
  strMeal: string
  strMealThumb: string
  strInstructions: string
  // Add other fields as needed
}

export async function fetchRecipeByName(name: string) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`)
    const data = await response.json()
    const recipe = data.meals?.[0]
    
    if (!recipe) return null

    return {
      id: recipe.idMeal,
      title: recipe.strMeal,
      image: recipe.strMealThumb,
      instructions: recipe.strInstructions,
      ingredients: [] // Parse ingredients from API response
    }
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return null
  }
} 