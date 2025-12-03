import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from supabase import create_client, Client

SUPABASE_URL = "https://lxueztdlrxoystjehjay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dWV6dGRscnhveXN0amVoamF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU0OTkxNiwiZXhwIjoyMDcyMTI1OTE2fQ.MdvEUVSPUBKjyNsmgwMsoIiOg-DZQariNzVBrQU2Etg"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def fetch_page(url: str) -> str | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        print(f"Fetched: {urlparse(url).path.split('/')[-1] or urlparse(url).netloc}")
        return resp.text
    except Exception as e:
        print(f"Failed {url}: {e}")
        return None


def parse_extra_fields(html: str) -> tuple[str | None, str | None, list[str]]:
    """
    Extract image, caption, and tags from a What's Gaby Cooking recipe page.
    Tags now come from COURSE and CUISINE in wprm-recipe-details section.
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1. Image: try recipe image first, then fallback to first <img>
    image_url = None

    # Try common recipe image containers
    img_candidates = []

    # WordPress Recipe Maker image
    for img in soup.select("img.wprm-recipe-image"):
        img_candidates.append(img)

    # Featured / post images
    for img in soup.select("figure img, .post-content img, .entry-content img"):
        img_candidates.append(img)

    for img in img_candidates:
        src = img.get("src")
        if src and "whatsgabycooking.com" in src:
            image_url = src
            break

    # 2. Caption: first reasonable paragraph near the top
    caption = None
    content_container = soup.select_one(".entry-content, .post-content, .wprm-recipe-container") or soup

    for p in content_container.find_all("p"):
        text = p.get_text(strip=True)
        if text and len(text) > 30:  # avoid tiny / empty captions
            caption = text
            break

    # 3. Tags: NOW extract COURSE and CUISINE from wprm-recipe-details
    tags: list[str] = []

    # Look in wprm-recipe-details div for course and cuisine
    details_container = soup.select_one("div.wprm-recipe-details")
    
    if details_container:
        # Try specific spans first
        course_el = details_container.select_one("span.wprm-recipe-course")
        if course_el:
            course = course_el.get_text(strip=True)
            if course:
                tags.append(course)

        cuisine_el = details_container.select_one("span.wprm-recipe-cuisine")
        if cuisine_el:
            cuisine = cuisine_el.get_text(strip=True)
            if cuisine:
                tags.append(cuisine)
    else:
        # Fallback: search entire page for wprm-recipe-course/cuisine spans
        course_el = soup.select_one("span.wprm-recipe-course")
        if course_el:
            course = course_el.get_text(strip=True)
            if course:
                tags.append(course)

        cuisine_el = soup.select_one("span.wprm-recipe-cuisine")
        if cuisine_el:
            cuisine = cuisine_el.get_text(strip=True)
            if cuisine:
                tags.append(cuisine)

    return image_url, caption, tags

def update_recipe_in_db(recipe_id: int, image: str | None, caption: str | None, tags: list[str]):
    """
    Update only image, caption, tags for a single recipe row.
    """
    payload: dict = {}
    if image:
        payload["image"] = image
    if caption:
        payload["caption"] = caption
    if tags:
        payload["tags"] = tags

    if not payload:
        print(f"  No new data for id={recipe_id}, skipping update")
        return

    response = (
        supabase
        .table("recipes")
        .update(payload)
        .eq("id", recipe_id)  # only touch this row
        .execute()
    )

    if response.data:
        print(f"  Updated id={recipe_id}")
    else:
        print(f"  Update failed for id={recipe_id}: {response}")

def get_remaining_gaby_recipes():
    """Get ONLY recipes that still need enrichment (image/caption/tags are null)"""
    response = (
        supabase
        .table("recipes")
        .select("id,title,url")
        .gte("id", 1265)  # Start after where you left off
        .like("url", "%whatsgabycooking.com%")
        .is_("image", None)  # Only ones without image yet
        .or_("caption.is.null,tags.is.null")  # OR no caption OR no tags
        .execute()
    )
    
    rows = response.data or []
    print(f"Found {len(rows)} REMAINING Gaby recipes to enrich")
    return rows

def main():
    recipes = get_remaining_gaby_recipes()
    
    if not recipes:
        print("✅ ALL Gaby recipes already enriched!")
        return
    
    for i, row in enumerate(recipes, start=1):
        recipe_id = row["id"]
        url = row["url"]
        print(f"\n[{i}/{len(recipes)}] id={recipe_id} → {url.split('/')[-1]}")

        html = fetch_page(url)
        if not html:
            print("  Skipping (fetch failed)")
            continue

        image, caption, tags = parse_extra_fields(html)
        print(f"  image:   {image or 'None'}")
        print(f"  caption: {caption[:80] + '...' if caption and len(caption) > 80 else caption or 'None'}")
        print(f"  tags:    {tags}")

        update_recipe_in_db(recipe_id, image, caption, tags)
        time.sleep(0.5)

    print("\n🎉 Finished remaining Gaby recipes!")

if __name__ == "__main__":
    main()
