#!/bin/bash
# Pushes all changes to GitHub using your GITHUB_TOKEN secret

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN is not set. Add it to Replit Secrets first."
    exit 1
fi

git config user.email "bot@replit.com"
git config user.name "Replit"
git remote set-url origin https://$GITHUB_TOKEN@github.com/glowsticks134-sudo/Ai-dc-server-maker.git
git add -A
git commit -m "Sync changes from Replit" 2>/dev/null || echo "ℹ️ Nothing new to commit."
git push origin main
echo "✅ Done!"
