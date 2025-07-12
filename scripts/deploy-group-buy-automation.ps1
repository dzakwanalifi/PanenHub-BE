# =================================================================
# SCRIPT DEPLOYMENT OTOMATISASI GROUP BUY (Windows PowerShell)
# =================================================================
# Script ini akan membantu deployment dan setup otomatisasi
# penyelesaian kampanye Group Buy secara otomatis di Windows
# =================================================================

Write-Host "🚀 Starting Group Buy Automation Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if npm/npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
    Write-Status "Node.js/npx is available"
} catch {
    Write-Error "npx is not installed. Please install Node.js first."
    exit 1
}

# Check if user is connected to Supabase project
Write-Host "🔐 Checking Supabase connection..." -ForegroundColor Cyan
try {
    $statusOutput = npx supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not connected to Supabase project"
    }
    Write-Status "Connected to Supabase project"
} catch {
    Write-Warning "Not connected to Supabase project. Please run the following commands:"
    Write-Host ""
    Write-Host "1. Login to Supabase:" -ForegroundColor White
    Write-Host "   npx supabase login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Link to your project:" -ForegroundColor White
    Write-Host "   npx supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Or initialize new project:" -ForegroundColor White
    Write-Host "   npx supabase init" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Deploy Edge Function
Write-Host "📦 Deploying Edge Function..." -ForegroundColor Cyan
try {
    npx supabase functions deploy complete-group-buy-campaigns
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Edge Function deployed successfully"
    } else {
        throw "Deployment failed"
    }
} catch {
    Write-Error "Failed to deploy Edge Function"
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get project info
Write-Host "📋 Getting project information..." -ForegroundColor Cyan
try {
    $statusOutput = npx supabase status
    $projectRef = ($statusOutput | Select-String "Project ref" | ForEach-Object { $_.Line.Split()[-1] })
    
    if ($projectRef) {
        Write-Status "Project ref detected: $projectRef"
        Write-Host "Function URL: https://$projectRef.supabase.co/functions/v1/complete-group-buy-campaigns" -ForegroundColor Cyan
    } else {
        Write-Warning "Could not automatically detect project ref."
        Write-Host "Please manually update the following in your SQL migration:" -ForegroundColor Yellow
        Write-Host "- Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-group-buy-campaigns" -ForegroundColor Gray
        Write-Host "- Anon Key: YOUR_SUPABASE_ANON_KEY" -ForegroundColor Gray
    }
} catch {
    Write-Warning "Could not get project information"
}

# Instructions for manual steps
Write-Host ""
Write-Host "🔧 Manual steps required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase Dashboard → Database → Extensions" -ForegroundColor White
Write-Host "   - Enable 'pg_cron' extension" -ForegroundColor Gray
Write-Host "   - Enable 'http' extension" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run migration file:" -ForegroundColor White
Write-Host "   sql/migrations/005_setup_group_buy_automation.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Update function URLs in the migration file with your actual:" -ForegroundColor White
if ($projectRef) {
    Write-Host "   - Project ref: $projectRef" -ForegroundColor Gray
} else {
    Write-Host "   - Project ref: YOUR_PROJECT_REF" -ForegroundColor Gray
}
Write-Host "   - Anon key from your project settings" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Activate the cron schedule by running this SQL:" -ForegroundColor White
Write-Host "   SELECT cron.schedule(" -ForegroundColor Gray
Write-Host "       'complete-expired-group-buy-campaigns'," -ForegroundColor Gray
Write-Host "       '0 * * * *'," -ForegroundColor Gray
Write-Host "       'SELECT public.trigger_group_buy_completion();'" -ForegroundColor Gray
Write-Host "   );" -ForegroundColor Gray
Write-Host ""

Write-Status "Deployment preparation completed!"
Write-Warning "Please complete the manual steps above to finish the setup."

Write-Host ""
Write-Host "📚 For detailed instructions, see: supabase/deploy-automation.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 To test the automation:" -ForegroundColor Cyan
Write-Host "   1. Create a test campaign with past end_date" -ForegroundColor Gray
Write-Host "   2. Run: SELECT public.trigger_group_buy_completion();" -ForegroundColor Gray
Write-Host "   3. Check: SELECT * FROM public.system_logs;" -ForegroundColor Gray
Write-Host "" 