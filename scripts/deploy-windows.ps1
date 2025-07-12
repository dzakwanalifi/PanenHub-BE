# Deployment script untuk Windows PowerShell
# Group Buy Automation Setup

Write-Host "Starting Group Buy Automation Deployment..." -ForegroundColor Green

# Check if npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
    Write-Host "Node.js/npx is available" -ForegroundColor Green
} catch {
    Write-Host "npx is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Deploy Edge Function
Write-Host "Deploying Edge Function..." -ForegroundColor Cyan
try {
    npx supabase functions deploy complete-group-buy-campaigns
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Edge Function deployed successfully" -ForegroundColor Green
    } else {
        throw "Deployment failed"
    }
} catch {
    Write-Host "Failed to deploy Edge Function" -ForegroundColor Red
    exit 1
}

# Get project info
Write-Host "Getting project information..." -ForegroundColor Cyan
try {
    $statusOutput = npx supabase status
    $projectRef = ($statusOutput | Select-String "Project ref" | ForEach-Object { $_.Line.Split()[-1] })
    
    if ($projectRef) {
        Write-Host "Project ref detected: $projectRef" -ForegroundColor Green
        Write-Host "Function URL: https://$projectRef.supabase.co/functions/v1/complete-group-buy-campaigns" -ForegroundColor Cyan
    } else {
        Write-Host "Could not automatically detect project ref." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not get project information" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Open Supabase Dashboard -> Database -> Extensions"
Write-Host "   - Enable 'pg_cron' extension"
Write-Host "   - Enable 'http' extension"
Write-Host ""
Write-Host "2. Run migration file: sql/migrations/005_setup_group_buy_automation.sql"
Write-Host ""
Write-Host "3. Update function URLs in the migration file"
Write-Host ""
Write-Host "4. Activate the cron schedule by running SQL:"
Write-Host "   SELECT cron.schedule('complete-expired-group-buy-campaigns', '0 * * * *', 'SELECT public.trigger_group_buy_completion();');"
Write-Host ""
Write-Host "Deployment preparation completed!" -ForegroundColor Green
Write-Host "Please complete the manual steps above to finish the setup." -ForegroundColor Yellow 