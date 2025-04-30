-- SQL commands to disable Row Level Security for the tables

-- Disable RLS for recipes table
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- Disable RLS for ingredients table
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;

-- Disable RLS for grocery_items table
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;

-- Grant permissions to the anon role
GRANT ALL PRIVILEGES ON TABLE recipes TO anon;
GRANT ALL PRIVILEGES ON TABLE ingredients TO anon;
GRANT ALL PRIVILEGES ON TABLE grocery_items TO anon; 