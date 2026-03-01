"""
Upload Bon Abbetit recipes to Supabase
Uses JSONB ingredients structure
"""

from supabase import create_client, Client
import json

SUPABASE_URL = "https://lxueztdlrxoystjehjay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU0OTkxNiwiZXhwIjoyMDcyMTI1OTE2fQ.MdvEUVSPUBKjyNsmgwMsoIiOg-DZQariNzVBrQU2Etg"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_recipes(filename: str = "bonabbetit_recipes.json"):
    """Upload Bon Abbetit recipes"""
    
    with open(filename, "r", encoding='utf-8') as f:
        recipes = json.load(f)
    
    print(f"📦 Loaded {len(recipes)} recipes from {filename}")
    print(f"🚀 Uploading to Supabase...\n")
    
    batch_size = 50
    inserted = 0
    failed = 0
    
    for i in range(0, len(recipes), batch_size):
        batch = recipes[i:i+batch_size]
        supabase_data = []
        
        for recipe in batch:
            supabase_data.append({
                "title": recipe["title"],
                "image": recipe.get("image"),
                "caption": recipe.get("caption"),
                "ingredients": recipe["ingredients"],  # JSONB format
                "steps": recipe["steps"],
                "tags": recipe.get("tags", []),
                "url": recipe["url"],
                "user_id": None
            })
        
        try:
            response = supabase.table("recipes").insert(supabase_data).execute()
            
            if response.data:
                inserted += len(response.data)
                print(f"✅ Batch {i//batch_size + 1}: {len(response.data)} recipes (Total: {inserted})")
            else:
                failed += len(batch)
                print(f"❌ Batch {i//batch_size + 1} failed")
        
        except Exception as e:
            failed += len(batch)
            print(f"❌ Batch {i//batch_size + 1} error: {e}")
    
    print(f"\n{'='*60}")
    print(f"📊 UPLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Uploaded: {inserted} recipes")
    print(f"❌ Failed:   {failed} recipes")
    print(f"📈 Success rate: {inserted/(inserted+failed)*100:.1f}%")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    upload_recipes()