import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

BASE_URL = "https://whatsgabycooking.com"

def fetch_page(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        print(f"Fetched: {urlparse(url).path.split('/')[-1] or urlparse(url).netloc}")
        return resp.text
    except Exception as e:
        print(f"Failed {url}: {e}")
        return None

def parse_recipe(html, url):
    soup = BeautifulSoup(html, "html.parser")
    
    # Title
    title_tag = soup.find("h1")
    title = title_tag.get_text(strip=True) if title_tag else "No Title"

    # Ingredients - PROVEN parser
    ingredients = []
    ingredients_ul = soup.find("ul", class_="wprm-recipe-ingredients")
    if ingredients_ul:
        for li in ingredients_ul.find_all("li", class_="wprm-recipe-ingredient"):
            amount = li.find("span", class_="wprm-recipe-ingredient-amount")
            unit = li.find("span", class_="wprm-recipe-ingredient-unit")
            name = li.find("span", class_="wprm-recipe-ingredient-name")
            notes = li.find("span", class_="wprm-recipe-ingredient-notes")
            
            text_parts = []
            if amount: text_parts.append(amount.get_text(strip=True))
            if unit: text_parts.append(unit.get_text(strip=True))
            if name: text_parts.append(name.get_text(strip=True))
            if notes: text_parts.append(f"({notes.get_text(strip=True)})")
            
            if text_parts:
                ingredients.append(" ".join(text_parts))

    # Instructions
    instructions = []
    instructions_ul = soup.find("ul", class_="wprm-recipe-instructions")
    if instructions_ul:
        for li in instructions_ul.find_all("li", class_="wprm-recipe-instruction"):
            text_div = li.find("div", class_="wprm-recipe-instruction-text")
            if text_div:
                instructions.append(text_div.get_text(separator=" ", strip=True))

    return {
        "title": title,
        "url": url,
        "ingredients": ingredients,
        "instructions": instructions
    }

def is_valid_recipe_url(url):
    """STRICT validation from DEBUG results"""
    try:
        parsed = urlparse(url)
        if 'whatsgabycooking.com' not in parsed.netloc:
            return False
        
        path = parsed.path.strip('/').lower()
        if len(path.split('/')) != 1:  # Must be /recipe-slug/
            return False
        
        if len(path) < 10 or path.count('-') < 1:
            return False
        
        exclude = ['category', 'tag', 'page', 'author', 'twitter', 'facebook', 'instagram', 
                  'shop', 'cookbooks', 'menu-plans', 'amazon']
        if any(ex in path for ex in exclude):
            return False
        
        return True
    except:
        return False

def get_recipe_links(html):
    """Extract ONLY valid recipe URLs"""
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    
    for a in soup.find_all("a", href=True):
        full_url = urljoin(BASE_URL, a["href"])
        if is_valid_recipe_url(full_url):
            links.add(full_url)
    
    return links

def crawl_paginated(start_url, max_pages=50):
    """Crawl paginated archive/blog/category"""
    all_urls = set()
    page = 1
    
    while page <= max_pages:
        if page == 1:
            url = start_url
        else:
            # Handle both /page/X/ and /page/X/
            url = f"{start_url.rstrip('/')}/page/{page}/"
        
        html = fetch_page(url)
        if not html:
            break
        
        new_links = get_recipe_links(html)
        if not new_links:
            print(f"  Page {page}: No more recipes")
            break
        
        new_valid = [link for link in new_links if link not in all_urls]
        all_urls.update(new_links)
        print(f"  Page {page}: {len(new_valid)} new recipes (total: {len(all_urls)})")
        
        page += 1
        time.sleep(1)
    
    return all_urls

def main():
    print("WHATS GABY COOKING - COMPLETE RECIPE SCRAPER\n")
    
    # PROVEN sources
    sources = [
        "https://whatsgabycooking.com/blog/",  # Archives (53 recipes)
        "https://whatsgabycooking.com/category/categories/dessert/",  # Dessert (57 recipes)
        "https://whatsgabycooking.com/category/categories/dinner/",
        "https://whatsgabycooking.com/category/categories/appetizers/",
        "https://whatsgabycooking.com/category/categories/salad/",
        "https://whatsgabycooking.com/category/categories/breakfast/",
    ]
    
    all_recipe_urls = set()
    
    # Crawl each source
    for source in sources:
        print(f"\nCrawling: {source.split('/')[-1]}")
        source_urls = crawl_paginated(source)
        all_recipe_urls.update(source_urls)
    
    print(f"\nTOTAL UNIQUE RECIPE URLs: {len(all_recipe_urls)}")
    
    # Scrape recipes
    recipes = []
    test_urls = list(all_recipe_urls)[:1500]
    
    print(f"\nScraping {len(test_urls)} recipes...")
    for i, url in enumerate(test_urls, 1):
        print(f"  {i}/{len(test_urls)}: {url.split('/')[-1]}", end=" ")
        html = fetch_page(url)
        if html:
            recipe = parse_recipe(html, url)
            if recipe["ingredients"] and len(recipe["ingredients"]) > 1:
                recipes.append(recipe)
                print(f"{len(recipe['ingredients'])} ingredients")
            else:
                print("No recipe data")
        else:
            print("Failed to fetch")
        time.sleep(0.5)
    
    # Save COMPLETE results
    output_file = "whats_gaby_complete_recipes.json"
    with open(output_file, "w", encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    
    print(f"\nSAVED {len(recipes)} PERFECT RECIPES to {output_file}")

    # For testing purposes
    print(f"Success rate: {len(recipes)/len(test_urls)*100:.1f}%")

if __name__ == "__main__":
    main()
