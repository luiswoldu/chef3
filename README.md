# Hands
Hands helps you organize your recipes, decide what to cook, and shop effortlessly. It's the best way to cook with Al. Import any recipe from your favorite blogs, Instagram, and TikTok. Plan weekly meals based on what you like to eat. Find saved recipes by ingredient. Build a smart shopping list in seconds.

# Set up
1. Set up SSH access (first time only)
If you haven't already, generate an SSH key and add it to your GitHub account
```
ssh-keygen -t ed25519 -C "your.email@example.com"
```
Add the SSH key to your SSH agent:
```
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```
Copy your public key and add it to your GitHub account:
```
cat ~/.ssh/id_ed25519.pub
```
2. Clone the repo 
```
git clone git@github.com:your-username/hands.git
cd hands
```
If working on team

```
git clone -b team git@github.com:your-username/hands.git
```
3. Install dependencies
```
npm install
```

4. Environment Configuration

Create .env.local and add Supabase credentials it (see .env.example)
```
env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
5. Run the development server
```
npm run dev
```
Navigate to http://localhost:3000 to see the application.

# Git Strategy
main → production-grade, stable code and deploys to app.handsforu.com (for beta and public launches)

team → internal shared development space, deploying to team.handsforu.com (for demos and testing); 

your-new-branch → all new development starts in isolated branches, used for private experimentation or local development before merging upstream

# Contributing

Create your own branch from team and name it after yourself. Make sure you keep this branch up to date when team is updated. I suggest deleting your personal branch and remaking it as a clone of team when you start a new task.

Do all testing and commits in your branch.

Push changes to your branch first, then make a pull request into team for review. Always check if your changes are live and deployed on team.handsfor.com after merging is approved. 

# File Structure That Scales
📂 app → UI and routing 

📂 components  → Reusable UI elements

📂 styles       →  Global styles or tailwind config

📂 lib           → Helpers, utilities, API clients

📂 public → static assets

📂 hooks           ← Custom hooks

📂 context         ← Context providers

📂 types           ← TypeScript types

📂 supabase        ← Supabase client & queries

📂.env.local       ← Environment config


# 🛠 Technologies
• Next.js (Framework)

• React/TypeScript (Frontend)

• Tailwind CSS (User Interface)

• Supabase (Auth & Database)

• Lucide Icons (Icons)

• Vercel (Hosting)

• Stripe (Payments) 

