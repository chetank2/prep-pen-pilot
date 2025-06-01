#!/bin/bash

# Setup Knowledge Base Categories Script
# This script adds the knowledge_categories table and Syllabus category to your database

echo "🗃️  Setting up Knowledge Base Categories..."

# Check if we have database access
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ No database URL found. Please set DATABASE_URL or SUPABASE_DB_URL environment variable."
    echo ""
    echo "To add the categories manually:"
    echo "1. Connect to your Supabase project"
    echo "2. Go to the SQL Editor"
    echo "3. Run the SQL from add_syllabus_category.sql"
    echo ""
    echo "Or set your database URL and run this script again:"
    echo "export DATABASE_URL='your-database-url'"
    exit 1
fi

# Determine which database URL to use
DB_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

echo "📊 Creating knowledge_categories table and adding categories..."

# Run the SQL script
if command -v psql &> /dev/null; then
    psql "$DB_URL" -f add_syllabus_category.sql
    if [ $? -eq 0 ]; then
        echo "✅ Knowledge base categories setup completed!"
        echo ""
        echo "📋 Available categories:"
        echo "  • Books (Academic and reference books)"
        echo "  • Standard Books (Curriculum and standard textbooks)"
        echo "  • Articles (Research papers and articles)"
        echo "  • 📋 Syllabus (Course syllabi and curricula) - NEWLY ADDED"
        echo "  • Question Papers (Past exam papers and questions)"
        echo "  • Notes (Personal and study notes)"
        echo "  • Videos (Educational videos and lectures)"
        echo "  • Images (Diagrams, charts, and images)"
        echo ""
        echo "🎉 The Syllabus category is now available in your Knowledge Base!"
    else
        echo "❌ Failed to setup categories. Please check your database connection."
    fi
else
    echo "❌ psql not found. Please install PostgreSQL client or run the SQL manually."
    echo ""
    echo "Manual setup:"
    echo "1. Open add_syllabus_category.sql"
    echo "2. Copy the SQL content"
    echo "3. Paste it in your Supabase SQL Editor"
    echo "4. Click 'RUN'"
fi 