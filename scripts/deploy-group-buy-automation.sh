#!/bin/bash

# =================================================================
# SCRIPT DEPLOYMENT OTOMATISASI GROUP BUY
# =================================================================
# Script ini akan membantu deployment dan setup otomatisasi
# penyelesaian kampanye Group Buy secara otomatis
# =================================================================

set -e  # Exit on any error

echo "🚀 Starting Group Buy Automation Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Supabase CLI is available
if ! command -v npx &> /dev/null; then
    print_error "npx is not installed. Please install Node.js first."
    exit 1
fi

print_status "Supabase CLI is available"

# Check if user is logged in to Supabase
echo "🔐 Checking Supabase authentication..."
if ! npx supabase status &> /dev/null; then
    print_warning "Not connected to Supabase project. Please run the following commands:"
    echo ""
    echo "1. Login to Supabase:"
    echo "   npx supabase login"
    echo ""
    echo "2. Link to your project:"
    echo "   npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "3. Or initialize new project:"
    echo "   npx supabase init"
    echo ""
    exit 1
fi

# Deploy Edge Function
echo "📦 Deploying Edge Function..."
if npx supabase functions deploy complete-group-buy-campaigns; then
    print_status "Edge Function deployed successfully"
else
    print_error "Failed to deploy Edge Function"
    exit 1
fi

# Get project info
echo "📋 Getting project information..."
PROJECT_REF=$(npx supabase status | grep "Project ref" | awk '{print $3}' || echo "")

if [ -z "$PROJECT_REF" ]; then
    print_warning "Could not automatically detect project ref."
    echo "Please manually update the following in your SQL migration:"
    echo "- Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/complete-group-buy-campaigns"
    echo "- Anon Key: YOUR_SUPABASE_ANON_KEY"
else
    print_status "Project ref detected: $PROJECT_REF"
    echo "Function URL: https://$PROJECT_REF.supabase.co/functions/v1/complete-group-buy-campaigns"
fi

# Instructions for manual steps
echo ""
echo "🔧 Manual steps required:"
echo ""
echo "1. Open Supabase Dashboard → Database → Extensions"
echo "   - Enable 'pg_cron' extension"
echo "   - Enable 'http' extension"
echo ""
echo "2. Run migration file:"
echo "   sql/migrations/005_setup_group_buy_automation.sql"
echo ""
echo "3. Update function URLs in the migration file with your actual:"
echo "   - Project ref: $PROJECT_REF"
echo "   - Anon key from your project settings"
echo ""
echo "4. Activate the cron schedule by running this SQL:"
echo "   SELECT cron.schedule("
echo "       'complete-expired-group-buy-campaigns',"
echo "       '0 * * * *',"
echo "       'SELECT public.trigger_group_buy_completion();'"
echo "   );"
echo ""

print_status "Deployment preparation completed!"
print_warning "Please complete the manual steps above to finish the setup."

echo ""
echo "📚 For detailed instructions, see: supabase/deploy-automation.md"
echo ""
echo "🧪 To test the automation:"
echo "   1. Create a test campaign with past end_date"
echo "   2. Run: SELECT public.trigger_group_buy_completion();"
echo "   3. Check: SELECT * FROM public.system_logs;"
echo "" 