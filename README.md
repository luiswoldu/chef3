# Git Strategy

## Branches
- **main** → production-grade, stable code  
  Deploys to **app.handsforu.com** (for beta and public launches)

- **team** → internal shared integration branch  
  Deploys to **team.handsforu.com** (for demos and testing)

- **frontend** / **backend** → role-based development branches where active work happens

---

## Contributing

1. **Always start by fetching the latest from `team`** before beginning new work:  
   ```bash
   git checkout team
   git pull origin team

Switch to your role branch (frontend or backend):
   ```bash
git checkout frontend   # or backend
git pull origin frontend
```

Commit and push your changes directly to the respective branch:
   ```bash
git add .
git commit -m "your message"
git push origin frontend
```

When your feature is ready, open a Pull Request from frontend or backend into team.

After review and merge, confirm your changes are live on team.handsforu.com and notify everyone in the Signal group chat so we can demo and test.

If approved by Luis, team can be merged into main for production deployment and ship.
