#!/bin/bash
# Database migration script for Render deployment

echo "Starting database migration..."

# Set database URL (replace with your actual Render database URL)
export DATABASE_URL="your_render_postgres_connection_string"

# Run migrations
npm run db:migrate

echo "Migration completed!"
