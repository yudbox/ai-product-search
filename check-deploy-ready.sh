#!/bin/bash

# 🚀 Pre-Deploy Checklist Script
# Проверяет готовность проекта к деплою на Vercel

echo "🔍 Checking deployment readiness..."
echo ""

ERRORS=0
WARNINGS=0

# 1. Check .env.local exists
echo "1️⃣ Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local exists"
    
    # Check required variables
    REQUIRED_VARS=("OPENAI_API_KEY" "PINECONE_API_KEY" "OPENAI_EMBEDDING_MODEL" "OPENAI_EMBEDDING_DIMENSIONS" "PINECONE_INDEX_NAME" "PINECONE_NAMESPACE")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo "   ✅ $var is set"
        else
            echo "   ❌ $var is missing!"
            ((ERRORS++))
        fi
    done
else
    echo "   ❌ .env.local not found!"
    ((ERRORS++))
fi
echo ""

# 2. Check .gitignore
echo "2️⃣ Checking security (.gitignore)..."
if grep -q "\.env" .gitignore; then
    echo "   ✅ .env files are ignored"
else
    echo "   ⚠️  .env files might be committed to git!"
    ((WARNINGS++))
fi
echo ""

# 3. Check build
echo "3️⃣ Testing production build..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed! Run 'npm run build' to see errors"
    ((ERRORS++))
fi
echo ""

# 4. Check dependencies
echo "4️⃣ Checking dependencies..."
REQUIRED_DEPS=("next" "react" "openai" "@pinecone-database/pinecone" "@vercel/kv")

for dep in "${REQUIRED_DEPS[@]}"; do
    if grep -q "\"${dep}\"" package.json; then
        echo "   ✅ $dep installed"
    else
        echo "   ❌ $dep is missing!"
        ((ERRORS++))
    fi
done
echo ""

# 5. Check git repository
echo "5️⃣ Checking git repository..."
if [ -d ".git" ]; then
    echo "   ✅ Git repository initialized"
    
    if git remote -v | grep -q "origin"; then
        REMOTE_URL=$(git remote get-url origin)
        echo "   ✅ Remote origin set: $REMOTE_URL"
    else
        echo "   ⚠️  No remote origin (GitHub not connected)"
        echo "      Run: gh repo create ai-product-search --public --source=. --remote=origin"
        ((WARNINGS++))
    fi
else
    echo "   ❌ Not a git repository!"
    ((ERRORS++))
fi
echo ""

# 6. Check Vercel CLI
echo "6️⃣ Checking Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo "   ✅ Vercel CLI installed"
    VERCEL_VERSION=$(vercel --version)
    echo "      Version: $VERCEL_VERSION"
else
    echo "   ⚠️  Vercel CLI not installed"
    echo "      Run: npm i -g vercel"
    ((WARNINGS++))
fi
echo ""

# 7. Check if already deployed
echo "7️⃣ Checking deployment status..."
if [ -f ".vercel/project.json" ]; then
    echo "   ✅ Project already linked to Vercel"
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    echo "      Project ID: $PROJECT_ID"
else
    echo "   ℹ️  Not yet deployed to Vercel"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Ready to deploy! 🚀"
    echo ""
    echo "Next steps:"
    echo "  1. Push to GitHub: git push origin main"
    echo "  2. Deploy: vercel --prod"
    echo "  or use Vercel Dashboard to import from GitHub"
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found"
    echo "   You can deploy, but consider fixing warnings"
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found"
    echo "   Fix errors before deploying!"
    exit 1
fi

echo ""
