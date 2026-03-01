"""
Fix missing images for Bon Abbetit recipes
Fetches images for recipes that are missing them
"""

import time
import requests
import json
from bs4 import BeautifulSoup
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

# Initialize Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def fetch_page(url: str) -> str:
    """Fetch page HTML"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  ✗ Failed to fetch: {e}")
        return None

def extract_image(html: str) -> str:
    """Extract image with multiple fallback methods"""
    soup = BeautifulSoup(html, "html.parser")
    image_url = ""
    
    # Method 1: JSON-LD Recipe image
    scripts = soup.find_all("script", {"type": "application/ld+json"})
    for script in scripts:
        try:
            data = json.loads(script.string)
            
            # Handle @graph structure
            if "@graph" in data:
                for item in data["@graph"]:
                    if item.get("@type") == "Recipe":
                        image_data = item.get("image")
                        # Handle array
                        if isinstance(image_data, list) and image_data:
                            image_url = image_data[0]
                        # Handle string
                        elif isinstance(image_data, str):
                            image_url = image_data
                        
                        if image_url:
                            return image_url
            
            # Handle direct Recipe object
            elif data.get("@type") == "Recipe":
                image_data = data.get("image")
                if isinstance(image_data, list) and image_data:
                    image_url = image_data[0]
                elif isinstance(image_data, str):
                    image_url = image_data
                
                if image_url:
                    return image_url
        except:
            pass
    
    # Method 2: OG image
    og_image = soup.find("meta", {"property": "og:image"})
    if og_image:
        image_url = og_image.get("content", "")
        if image_url:
            return image_url
    
    # Method 3: Twitter image
    twitter_image = soup.find("meta", {"name": "twitter:image"})
    if twitter_image:
        image_url = twitter_image.get("content", "")
        if image_url:
            return image_url
    
    # Method 4: First image in entry-content
    content_div = soup.find("div", class_=lambda x: x and ("entry-content" in x or "post-content" in x))
    if content_div:
        img = content_div.find("img")
        if img:
            # Try src, data-src, or srcset
            image_url = img.get("src") or img.get("data-src") or ""
            if not image_url and img.get("srcset"):
                # Parse srcset and get first URL
                srcset = img.get("srcset", "")
                if srcset:
                    image_url = srcset.split()[0].rstrip(',')
            
            if image_url:
                return image_url
    
    # Method 5: Featured image
    featured_img = soup.find("img", class_=lambda x: x and ("featured" in x or "wp-post-image" in x))
    if featured_img:
        image_url = featured_img.get("src") or featured_img.get("data-src") or ""
        if image_url:
            return image_url
    
    return ""

def main():
    print("🖼️  FIXING BON ABBETIT IMAGES\n")
    print("="*60)
    
    # Find Bon Abbetit recipes with empty images
    print("\n📋 Fetching recipes with empty images...\n")
    
    response = supabase.table('recipes') \
        .select('id, title, url, image') \
        .like('url', '%bonabbetit.com%') \
        .execute()
    
    all_bonabbetit = response.data
    
    # Filter for empty images
    empty_image_recipes = [
        r for r in all_bonabbetit 
        if not r.get('image') or r.get('image').strip() == ''
    ]
    
    print(f"📊 Total Bon Abbetit recipes: {len(all_bonabbetit)}")
    print(f"⚠️  Missing images: {len(empty_image_recipes)}")
    print(f"✅ Already have images: {len(all_bonabbetit) - len(empty_image_recipes)}")
    
    if not empty_image_recipes:
        print("\n✅ All Bon Abbetit recipes already have images!")
        return
    
    print(f"\n🔄 Processing {len(empty_image_recipes)} recipes...\n")
    print("="*60 + "\n")
    
    updated = 0
    failed = 0
    
    for i, recipe in enumerate(empty_image_recipes, 1):
        recipe_id = recipe['id']
        title = recipe['title']
        url = recipe['url']
        
        print(f"[{i}/{len(empty_image_recipes)}] {title}")
        print(f"  URL: {url}")
        
        # Fetch page
        html = fetch_page(url)
        if not html:
            failed += 1
            print(f"  ❌ Failed to fetch page")
            continue
        
        # Extract image
        image_url = extract_image(html)
        
        if image_url:
            # Update database
            try:
                supabase.table('recipes') \
                    .update({'image': image_url}) \
                    .eq('id', recipe_id) \
                    .execute()
                
                updated += 1
                print(f"  ✅ Image: {image_url[:60]}...")
            except Exception as e:
                failed += 1
                print(f"  ❌ Database update failed: {e}")
        else:
            failed += 1
            print(f"  ⚠️  No image found")
        
        # Rate limiting
        time.sleep(0.5)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 IMAGE FIX COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Updated: {updated} recipes")
    print(f"❌ Failed:  {failed} recipes")
    print(f"📈 Success rate: {updated/len(empty_image_recipes)*100:.1f}%")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()