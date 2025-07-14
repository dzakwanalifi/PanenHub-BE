# PowerShell script to fix pricing and RLS issues

Write-Host "🔧 Fixing pricing and RLS issues..." -ForegroundColor Yellow

# Get database URL from environment or prompt
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL environment variable not set!" -ForegroundColor Red
    Write-Host "Please set your Supabase database URL:" -ForegroundColor Yellow
    Write-Host "Set-Variable -Name 'DATABASE_URL' -Value 'your-supabase-connection-string'" -ForegroundColor Cyan
    exit 1
}

try {
    # Run the RPC function creation
    Write-Host "📝 Creating checkout session RPC function..." -ForegroundColor Blue
    psql $env:DATABASE_URL -f "sql/migrations/create_checkout_session_function.sql"
    
    # Update product prices to IDR
    Write-Host "💰 Updating product prices to Indonesian Rupiah..." -ForegroundColor Blue
    psql $env:DATABASE_URL -f "sql/migrations/update_product_prices_to_idr.sql"
    
    Write-Host "✅ Migrations completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Checking updated product prices..." -ForegroundColor Blue
    psql $env:DATABASE_URL -c "SELECT title, price, unit FROM public.products LIMIT 10;"
    
} catch {
    Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
    exit 1
}
