-- Add tsvector columns to store search vectors
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS searchable_title tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS searchable_name tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, ''))) STORED;

-- Create GIN indexes for fast full-text search
CREATE INDEX IF NOT EXISTS recipes_searchable_title_idx 
    ON recipes USING GIN (searchable_title);

CREATE INDEX IF NOT EXISTS ingredients_searchable_name_idx 
    ON ingredients USING GIN (searchable_name);

-- Create a function to search recipes by title or ingredient name
CREATE OR REPLACE FUNCTION search_recipes(search_term TEXT)
RETURNS SETOF recipes AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT r.*
    FROM recipes r
    LEFT JOIN ingredients i ON r.id = i.recipe_id
    WHERE 
        r.searchable_title @@ plainto_tsquery('english', search_term)
        OR i.searchable_name @@ plainto_tsquery('english', search_term);
END;
$$ LANGUAGE plpgsql; 