import { supabase } from "./client";

export async function trackRecipeView(recipeId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_recipe_interactions")
      .upsert(
        { 
          user_id: user.id, 
          recipe_id: recipeId, 
          last_viewed_at: new Date().toISOString() 
        },
        { onConflict: "user_id,recipe_id" }
      );
    
    if (error) {
      console.error("Recipe view tracking error:", error);
    }
  } catch (err) {
    console.error("Failed to track recipe view:", err);
  }
}

export async function trackRecipeInteraction(
  recipeId: string, 
  interactionType: 'view' | 'tap' | 'share' | 'save' = 'view'
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const timestamp = new Date().toISOString();
    const updateData: Record<string, any> = {
      user_id: user.id,
      recipe_id: recipeId,
    };

    // Set the appropriate timestamp based on interaction type
    switch (interactionType) {
      case 'view':
        updateData.last_viewed_at = timestamp;
        break;
      case 'tap':
        updateData.last_viewed_at = timestamp;
        break;
      case 'share':
        updateData.last_shared_at = timestamp;
        break;
      case 'save':
        updateData.last_saved_at = timestamp;
        break;
    }

    const { error } = await supabase
      .from("user_recipe_interactions")
      .upsert(updateData, { onConflict: "user_id,recipe_id" });
    
    if (error) {
      console.error(`Recipe ${interactionType} tracking error:`, error);
    }
  } catch (err) {
    console.error(`Failed to track recipe ${interactionType}:`, err);
  }
}

// Helper function specifically for recipe card interactions
export async function trackRecipeCardView(recipeId: string) {
  return trackRecipeInteraction(recipeId, 'view');
}

export async function trackRecipeCardTap(recipeId: string) {
  return trackRecipeInteraction(recipeId, 'tap');
} 