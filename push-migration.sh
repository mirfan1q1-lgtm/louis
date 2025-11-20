#!/bin/bash

# Script untuk push migration ke Supabase dan verifikasi RLS
# Usage: ./push-migration.sh

echo "🚀 Starting Supabase Migration Push..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example if exists..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please fill in your Supabase credentials."
        exit 1
    else
        echo "❌ No .env file found. Please create one with:"
        echo "   VITE_SUPABASE_URL=your-project-url"
        echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
        exit 1
    fi
fi

# Check if Supabase project is linked
echo "📋 Checking Supabase project status..."
npx supabase status 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Supabase project not linked. Please link your project:"
    echo "   npx supabase link --project-ref your-project-ref"
    echo ""
    echo "   Or push migration directly via SQL Editor in Supabase Dashboard:"
    echo "   1. Go to Supabase Dashboard → SQL Editor"
    echo "   2. Copy content from: supabase/migrations/20250125000000_final_schema.sql"
    echo "   3. Paste and run"
    exit 1
fi

# Push migration
echo ""
echo "📤 Pushing migration to Supabase..."
npx supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration pushed successfully!"
    echo ""
    echo "🔍 Verifying RLS policies..."
    echo ""
    echo "Please verify in Supabase Dashboard:"
    echo "1. Go to Authentication → Policies"
    echo "2. Check that RLS is enabled on all tables"
    echo "3. Verify policies for teachers and students"
else
    echo ""
    echo "❌ Migration push failed!"
    echo ""
    echo "Alternative: Push migration via SQL Editor:"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Copy content from: supabase/migrations/20250125000000_final_schema.sql"
    echo "3. Paste and run"
fi

