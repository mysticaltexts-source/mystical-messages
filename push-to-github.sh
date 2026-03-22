#!/bin/bash

# ============================================================
# Mystical Messages - Push to GitHub Script
# ============================================================
# This script will push your code to GitHub.
# 
# Before running this script:
# 1. Make sure you're logged into GitHub in your browser
# 2. You may need to enter your GitHub username and password
#    (or Personal Access Token if you have 2FA enabled)
# ============================================================

echo "🚀 Pushing Mystical Messages to GitHub..."
echo ""

# Set the remote URL
echo "📡 Setting up GitHub remote..."
git remote set-url origin https://github.com/mysticaltexts-source/mystical-messages.git

# Ensure we're on the main branch
echo "🌿 Switching to main branch..."
git branch -M main

# Push to GitHub
echo "⬆️ Pushing code to GitHub..."
echo ""
echo "⚠️ You may be asked for your GitHub credentials:"
echo "   - Username: mysticaltexts-source"
echo "   - Password: Your GitHub password OR Personal Access Token"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your code has been pushed to GitHub!"
    echo ""
    echo "🌐 View your repository at:"
    echo "   https://github.com/mysticaltexts-source/mystical-messages"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Go to https://railway.app"
    echo "   2. Click 'New Project'"
    echo "   3. Select 'Deploy from GitHub repo'"
    echo "   4. Choose 'mystical-messages'"
    echo "   5. Click 'Deploy Now'"
    echo ""
else
    echo ""
    echo "❌ Push failed. Common solutions:"
    echo ""
    echo "   1. If you have 2FA enabled, use a Personal Access Token instead of password"
    echo "      Create one at: https://github.com/settings/tokens"
    echo ""
    echo "   2. Make sure the repository exists:"
    echo "      https://github.com/mysticaltexts-source/mystical-messages"
    echo ""
    echo "   3. Try using SSH instead:"
    echo "      git remote set-url origin git@github.com:mysticaltexts-source/mystical-messages.git"
    echo "      git push -u origin main"
    echo ""
fi