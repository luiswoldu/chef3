"""
Bon Abbetit Scraper - Uses WordPress API + JSON-LD structured data
Much cleaner than BeautifulSoup since they have proper schema markup
"""

import time
import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from typing import Dict, List, Optional

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

BASE_URL = "https://bonabbetit.com"
API_URL = f"{BASE_URL}/wp-json/wp/v2/posts"

def fetch_page(url: str) -> Optional[str]:
    """Fetch page HTML"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"✗ Failed {url}: {e}")
        return None

def get_all_recipe_urls() -> List[str]:
    """Fetch all recipe URLs from WordPress API"""
    all_urls = []
    page = 1
    per_page = 100
    
    print("📋 Fetching recipe URLs from WordPress API...\n")
    
    while True:
        url = f"{API_URL}?per_page={per_page}&page={page}"
        
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            posts = resp.json()
            
            if not posts:
                break
            
            for post in posts:
                recipe_url = post.get("link")
                if recipe_url:
                    all_urls.append(recipe_url)
            
            print(f"  Page {page}: +{len(posts)} recipes (total: {len(all_urls)})")
            page += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  Error on page {page}: {e}")
            break
    
    print(f"\n✅ Found {len(all_urls)} recipe URLs\n")
    return all_urls

def extract_json_ld(html: str) -> Optional[Dict]:
    """Extract Recipe schema from JSON-LD"""
    soup = BeautifulSoup(html, "html.parser")
    
    # Find the JSON-LD script tag
    scripts = soup.find_all("script", {"type": "application/ld+json"})
    
    for script in scripts:
        try:
            data = json.loads(script.string)
            
            # Handle @graph structure
            if "@graph" in data:
                for item in data["@graph"]:
                    if item.get("@type") == "Recipe":
                        return item
            # Handle direct Recipe object
            elif data.get("@type") == "Recipe":
                return data
                
        except json.JSONDecodeError:
            continue
    
    return None

def parse_recipe(html: str, url: str) -> Optional[Dict]:
    """Parse recipe from JSON-LD structured data"""
    
    # Extract JSON-LD
    recipe_data = extract_json_ld(html)
    if not recipe_data:
        print(f"  ⚠ No recipe schema found")
        return None
    
    # Title
    title = recipe_data.get("name", "No Title")
    
    # Image - get first image from array
    image = None
    image_data = recipe_data.get("image")
    if isinstance(image_data, list) and image_data:
        image = image_data[0]
    elif isinstance(image_data, str):
        image = image_data
    
    # Caption/Description
    caption = recipe_data.get("description", "")
    
    # Ingredients - already in simple array format!
    ingredients_list = recipe_data.get("recipeIngredient", [])
    
    # Store as structured format for consistency with other scrapers
    # Bon Abbetit doesn't have subheadings, so everything goes in "Ingredients"
    ingredients = {
        "Ingredients": ingredients_list
    }
    
    # Steps - extract text from HowToStep objects
    steps = []
    instructions = recipe_data.get("recipeInstructions", [])
    for instruction in instructions:
        if isinstance(instruction, dict):
            step_text = instruction.get("text", "")
            if step_text:
                steps.append(step_text)
        elif isinstance(instruction, str):
            steps.append(instruction)
    
    # Tags - extract from articleSection in the page
    soup = BeautifulSoup(html, "html.parser")
    tags = []
    
    # Try to find tags from schema
    scripts = soup.find_all("script", {"type": "application/ld+json"})
    for script in scripts:
        try:
            data = json.loads(script.string)
            if "@graph" in data:
                for item in data["@graph"]:
                    if item.get("@type") == "Article":
                        article_sections = item.get("articleSection", [])
                        if article_sections:
                            # Take first 3 tags
                            tags = article_sections[:3]
                            break
        except:
            pass
    
    return {
        "title": title,
        "url": url,
        "ingredients": ingredients,
        "steps": steps,
        "image": image,
        "caption": caption,
        "tags": tags
    }

def main():
    print("🍳 BON ABBETIT SCRAPER\n")
    
    # Get all recipe URLs
    recipe_urls = get_all_recipe_urls()
    
    if not recipe_urls:
        print("❌ No recipe URLs found!")
        return
    
    # Scrape recipes
    recipes = []
    failed = []
    
    print(f"🔄 Scraping {len(recipe_urls)} recipes...\n")
    
    for i, url in enumerate(recipe_urls, 1):
        print(f"[{i}/{len(recipe_urls)}] {url.split('/')[-2]}")
        
        html = fetch_page(url)
        if not html:
            failed.append(url)
            continue
        
        recipe = parse_recipe(html, url)
        if recipe:
            if recipe["ingredients"] and len(recipe["steps"]) > 0:
                recipes.append(recipe)
                print(f"  ✓ {len(recipe['ingredients']['Ingredients'])} ingredients, {len(recipe['steps'])} steps")
            else:
                failed.append(url)
                print(f"  ⚠ Incomplete data")
        else:
            failed.append(url)
        
        time.sleep(0.5)
    
    # Save results
    output_file = "bonabbetit_recipes.json"
    with open(output_file, "w", encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 SCRAPING COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Scraped: {len(recipes)} recipes")
    print(f"❌ Failed:  {len(failed)} recipes")
    print(f"📁 Saved to: {output_file}")
    print(f"📈 Success rate: {len(recipes)/(len(recipe_urls))*100:.1f}%")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()