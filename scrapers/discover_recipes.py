import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

BASE_URL = "https://whatsgabycooking.com"

def fetch_page(url):
    resp = requests.get(url, headers=HEADERS, timeout=10)
    print(f"Status {resp.status_code}: {url}")
    return resp.text if resp.status_code == 200 else None

print("🔍 DISCOVERING REAL CATEGORIES...\n")

# 1. Test CATEGORIES PAGE (confirmed to exist)
print("=== TESTING CATEGORIES PAGE ===")
categories_html = fetch_page("https://whatsgabycooking.com/category/categories/")
if categories_html:
    soup = BeautifulSoup(categories_html, "html.parser")
    print("CATEGORIES PAGE WORKS!")
    
    print("\n=== ALL RECIPE CATEGORIES FOUND ===")
    recipe_categories = []
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True).lower()
        href = a["href"]
        
        # Match categories from your attachment
        recipe_words = ["dinner", "dessert", "appetizers", "salad", "breakfast", "lunch", 
                       "pasta", "sides", "soup", "bread", "pizza", "tacos", "bowls", 
                       "appetizer", "desserts", "salads"]
        if any(word in text for word in recipe_words) and "/category/" in href:
            full_url = urljoin(BASE_URL, href)
            recipe_categories.append(full_url)
            print(f"   {full_url}")
    
    print(f"\n🎉 FOUND {len(recipe_categories)} RECIPE CATEGORIES!")
    print("\nCopy these URLs into your scraper CATEGORIES list!")
else:
    print("Categories page failed")

print("\n=== TESTING FIRST CATEGORY ===")
if recipe_categories:
    first_cat = recipe_categories[0]
    cat_html = fetch_page(first_cat)
    if cat_html:
        soup = BeautifulSoup(cat_html, "html.parser")
        print(f"First category works: {first_cat}")
        print("Sample recipe links:")
        for a in soup.find_all("a", href=True)[:3]:
            href = a["href"]
            if len(href.split("/")) == 3:  # Recipe pattern
                print(f"  → {urljoin(BASE_URL, href)}")
