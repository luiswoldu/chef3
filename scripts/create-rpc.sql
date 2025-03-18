-- Create a function to disable RLS that can be called from client
CREATE OR REPLACE FUNCTION public.disable_rls_for_recipes()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This makes it run with the privileges of the creator
AS $$
BEGIN
  -- Disable RLS for recipes
  ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
  
  -- Disable RLS for ingredients
  ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error disabling RLS: %', SQLERRM;
    RETURN false;
END;
$$; 