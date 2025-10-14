# Test Plan for Sign Up and Import Fixes

## Prerequisites

Before testing, ensure:
1. Node.js and npm are installed
2. Environment variables are properly configured in `.env.local`
3. Supabase project is set up with correct database schema
4. Email authentication is enabled in Supabase

## Test Scenarios

### 1. Sign Up Flow (Critical Path)

#### Test Case 1.1: New User Sign Up
**Steps:**
1. Navigate to `/signup`
2. Fill in all required fields:
   - First name: "Test"
   - Username: "testuser"
   - Email: "test@example.com"
   - Password: "password123"
   - Confirm password: "password123"
3. Click "Create account"

**Expected Results:**
- User should see verification screen
- Email should be sent to test@example.com
- No console errors
- Signup data should be stored in localStorage

#### Test Case 1.2: Email Verification
**Steps:**
1. Check email inbox for verification link
2. Click verification link
3. Should redirect to `/auth/callback`
4. Should process and redirect to `/onboarding-profile`

**Expected Results:**
- Successful authentication
- User session created
- Redirect to onboarding profile page
- Signup data retrieved from localStorage

#### Test Case 1.3: Profile Completion
**Steps:**
1. On onboarding-profile page
2. First name should be pre-filled (from signup)
3. Select breakfast preference
4. Click "Complete setup"

**Expected Results:**
- User profile created in database
- Redirect to `/home`
- User logged in successfully

### 2. Error Handling Tests

#### Test Case 2.1: Duplicate Email
**Steps:**
1. Try to sign up with an existing email
2. Submit form

**Expected Results:**
- Clear error message about existing account
- Suggestion to sign in instead

#### Test Case 2.2: Invalid Email Format
**Steps:**
1. Enter invalid email (e.g., "invalid-email")
2. Submit form

**Expected Results:**
- Validation error before submission
- Clear message about email format

#### Test Case 2.3: Password Mismatch
**Steps:**
1. Enter different passwords in password and confirm password fields
2. Submit form

**Expected Results:**
- Validation error: "Passwords don't match"
- Form not submitted

### 3. Recipe Import Validation Tests

#### Test Case 3.1: Valid Recipe Import
**Steps:**
1. Call `createValidatedRecipe()` with valid data:
```javascript
{
  title: "Test Recipe",
  steps: ["Step 1", "Step 2"],
  user_id: "user-123",
  image: "image.jpg",
  tags: ["breakfast"]
}
```

**Expected Results:**
- Recipe created successfully
- All fields properly saved
- No validation errors

#### Test Case 3.2: Recipe Without Steps
**Steps:**
1. Call `createValidatedRecipe()` with no steps:
```javascript
{
  title: "Test Recipe",
  steps: [],
  user_id: "user-123"
}
```

**Expected Results:**
- Validation error: "Recipe must have at least one valid step"
- Recipe not created

#### Test Case 3.3: Recipe With Empty Steps
**Steps:**
1. Call `createValidatedRecipe()` with empty/whitespace steps:
```javascript
{
  title: "Test Recipe",
  steps: ["", "   ", "\n"],
  user_id: "user-123"
}
```

**Expected Results:**
- Validation error: "Recipe must have at least one valid step"
- Empty steps filtered out

### 4. Authentication Edge Cases

#### Test Case 4.1: Expired Verification Link
**Steps:**
1. Use an old/expired verification link
2. Access callback URL

**Expected Results:**
- Clear error message
- Redirect to login with error parameter
- Option to resend verification email

#### Test Case 4.2: Malformed Verification Link
**Steps:**
1. Access `/auth/callback` with invalid parameters
2. Check error handling

**Expected Results:**
- No crashes or infinite loops
- Clear error message
- Redirect to login page

### 5. Database Integration Tests

#### Test Case 5.1: Database Connection Issues
**Steps:**
1. Temporarily use invalid Supabase credentials
2. Attempt sign up
3. Attempt profile creation

**Expected Results:**
- Clear error messages (not technical database errors)
- Graceful handling of connection failures
- User-friendly error messages

#### Test Case 5.2: Missing Tables
**Steps:**
1. Test with missing Users table
2. Attempt profile creation

**Expected Results:**
- Error: "Database not properly configured - Users table missing"
- No cryptic database errors

### 6. Environment Configuration Tests

#### Test Case 6.1: Missing Environment Variables
**Steps:**
1. Remove `NEXT_PUBLIC_SUPABASE_URL` from environment
2. Start application

**Expected Results:**
- Clear error message about missing configuration
- Application doesn't crash silently

## Manual Testing Checklist

- [ ] Sign up with new email works
- [ ] Email verification link works
- [ ] Profile creation completes successfully  
- [ ] Recipe validation prevents empty steps
- [ ] Error messages are user-friendly
- [ ] No console errors during normal flow
- [ ] Duplicate email handling works
- [ ] Password validation works
- [ ] Email resend functionality works
- [ ] Auth callback handles edge cases

## Automated Testing Commands

Once Node.js is available, run:

```bash
# Install dependencies
npm install

# Run TypeScript type checking
npx tsc --noEmit

# Build the application (checks for compilation errors)
npm run build

# Start development server for manual testing
npm run dev
```

## Browser Testing

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)  
- Safari (if on macOS)

Test responsive design on mobile devices.

## Production Testing

Before deploying to production:
1. Test with production Supabase instance
2. Verify email templates render correctly
3. Test email deliverability  
4. Verify redirect URLs work with production domain
5. Test error monitoring and logging

## Success Criteria

All tests pass and:
1. Users can successfully sign up and verify email
2. User profiles are created with proper validation
3. Recipes cannot be imported without steps
4. Error messages are clear and actionable
5. No data corruption or orphaned records
6. Performance remains acceptable
7. Security best practices are maintained