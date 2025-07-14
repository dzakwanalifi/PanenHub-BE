#!/bin/bash

# Script to fix pricing and RLS issues

echo "🔧 Fixing pricing and RLS issues..."

# Run the RPC function creation
echo "📝 Creating checkout session RPC function..."
psql $DATABASE_URL -f sql/migrations/create_checkout_session_function.sql

# Update product prices to IDR
echo "💰 Updating product prices to Indonesian Rupiah..."
psql $DATABASE_URL -f sql/migrations/update_product_prices_to_idr.sql

echo "✅ Migrations completed!"
echo ""
echo "🔍 Checking updated product prices..."
psql $DATABASE_URL -c "SELECT title, price, unit FROM public.products LIMIT 10;"
