# Chef3 Setup and Troubleshooting Guide

## Quick Setup

1. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual Supabase and OpenAI credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Sign Up and Import Issues - Fixed

### Issues Addressed:

1. **Duplicate Onboarding Flows** - The app had two different onboarding systems that could conflict
2. **Missing Environment Variables** - Added proper configuration for email redirects
3. **Recipe Import Validation** - Added comprehensive validation to ensure recipes have proper Steps
4. **Database Schema Issues** - Added better error handling for missing tables

### Key Fixes Applied:

1. **Fixed Environment Variable Usage**
   - Replaced `process.env.NEXT_PUBLIC_APP_URL` with `window.location.origin` in Step6.tsx
   - Added `.env.local` template with proper configuration

2. **Enhanced Recipe Validation**
   - Added `validateRecipeForImport()` function in `lib/db.ts`
   - Added `createValidatedRecipe()` function to ensure recipes always have valid steps
   - Enhanced error messages for recipe import failures

3. **Improved User Profile Creation**
   - Added input validation for required fields
   - Better error handling for duplicate profiles
   - Helpful error messages for database configuration issues

4. **Enhanced Authentication Flow**
   - Improved signup error handling
   - Better email verification flow
   - More robust auth callback processing

### Testing the Fixes

1. **Test Sign Up Flow**
   ```
   1. Go to /signup
   2. Fill out all fields
   3. Submit form
   4. Check email for verification link
   5. Click verification link
   6. Complete onboarding profile
   ```

2. **Test Recipe Import**
   ```
   1. Ensure recipes have at least one step in the steps array
   2. Verify user_id is properly set
   3. Check that validation errors are displayed properly
   ```

### Common Issues and Solutions

1. **"Some users can't sign up" Error**
   - **Solution**: Check that Supabase email confirmation is properly configured
   - **Check**: Supabase Dashboard > Authentication > Settings > Email Confirmation

2. **"User recipes are imported without Steps" Error**
   - **Solution**: Use the new `createValidatedRecipe()` function instead of direct `createRecipe()`
   - **Validation**: The function now ensures all recipes have at least one valid step

3. **Database Connection Issues**
   - **Solution**: Verify `.env.local` has correct Supabase URL and anon key
   - **Check**: Test connection in Supabase dashboard

4. **Email Verification Not Working**
   - **Solution**: Check email redirect URL in authentication settings
   - **Config**: Should point to `{your-domain}/auth/callback`

### Database Schema Requirements

For the fixes to work properly, ensure your Supabase database has:

1. **Users Table** with columns:
   - `id` (text, primary key)
   - `first_name` (text, nullable)
   - `username` (text, nullable)
   - `email` (text, not null)
   - `taste_preference` (text, nullable)
   - `created_at` (timestamp)

2. **recipes Table** with columns:
   - `id` (serial, primary key)
   - `title` (text, not null)
   - `image` (text, nullable)
   - `caption` (text, nullable)
   - `steps` (text[], not null) - **Important: Must be array type**
   - `tags` (text[], nullable)
   - `user_id` (text, not null)
   - `created_at` (timestamp)
   - `updated_at` (timestamp, nullable)

### Next Steps

1. Update your `.env.local` file with actual credentials
2. Test the sign up flow end-to-end
3. Verify recipe imports include proper steps
4. Check error logging in browser console for any remaining issues

## Support

If you continue to experience issues:
1. Check browser console for detailed error messages
2. Verify database schema matches requirements above
3. Ensure all environment variables are properly set
4. Test with a fresh user account