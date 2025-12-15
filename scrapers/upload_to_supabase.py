from supabase import create_client, Client
import json

# SERVICE ROLE KEY (bypasses RLS) - PASTE YOURS HERE
SUPABASE_URL = "https://lxueztdlrxoystjehjay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU0OTkxNiwiZXhwIjoyMDcyMTI1OTE2fQ.MdvEUVSPUBKjyNsmgwMsoIiOg-DZQariNzVBrQU2Etg"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

with open("whats_gaby_cooking.json", "r") as f:
    recipes = json.load(f)

print(f"Uploading {len(recipes)} recipes with SERVICE ROLE (bypasses RLS)...")

batch_size = 20
inserted = 0

for i in range(0, len(recipes), batch_size):
    batch = recipes[i:i+batch_size]
    supabase_data = []
    
    for recipe in batch:
        supabase_data.append({
            "title": recipe["title"],
            "image": None,
            "caption": None,
            "ingredients": recipe["ingredients"],
            "steps": recipe["instructions"],
            "tags": None,
            "url": recipe["url"],
            "user_id": None  # RLS allows NULL user_id with service key
        })
    
    response = supabase.table("recipes").insert(supabase_data).execute()
    
    if response.data:
        inserted += len(response.data)
        print(f"Batch {i//batch_size + 1}: {len(response.data)} recipes (Total: {inserted})")
    else:
        print(f"Batch {i//batch_size + 1} failed: {response}")

print(f"\n🎉 {inserted} recipes UPLOADED! Total: 190 + {inserted}")
