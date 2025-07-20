# Deployment script untuk Google Cloud Run
# PanenHub Backend Deployment

param(
    [string]$Region = "us-central1",
    [string]$ProjectId = "panenhub-mvp",
    [string]$ServiceName = "panenhub-backend"
)

Write-Host "Starting PanenHub Backend Deployment to Google Cloud Run..." -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor Cyan
Write-Host "Service: $ServiceName" -ForegroundColor Cyan

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
    Write-Host "Google Cloud CLI is available" -ForegroundColor Green
} catch {
    Write-Host "Google Cloud CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Set the project
Write-Host "Setting Google Cloud project..." -ForegroundColor Cyan
gcloud config set project $ProjectId

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Cyan
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy
Write-Host "Building and deploying to Cloud Run..." -ForegroundColor Cyan
try {
    gcloud run deploy $ServiceName `
        --source . `
        --platform managed `
        --region $Region `
        --allow-unauthenticated `
        --port 8000 `
        --memory 1Gi `
        --cpu 1 `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 900 `
        --cpu-boost `
        --set-env-vars "NODE_ENV=production,SUPABASE_URL=https://vfbzazavjhtqpkhhgpff.supabase.co,SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmYnphemF2amh0cXBraGhncGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNDc1MjgsImV4cCI6MjA2NzYyMzUyOH0.m-gnlEopd9YVyUc49DUN3e4A0_R-Y0OQiScYohUKLxc,SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmYnphemF2amh0cXBraGhncGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA0NzUyOCwiZXhwIjoyMDY3NjIzNTI4fQ.n43dfLWiQHOlV2gnm-aBqwDGA9CkcYGqx9NImydV0t4,SUPABASE_JWT_SECRET=nGblBUoj2fwNRHBuYtjG5VeBXiC5SNubfPxNZ1gqFG/d/EjGa/4+quZ433xvyr7toC8K0vLudGIlqG1oyUMCsQ==,TRIPAY_API_KEY=DEV-NyqsWoHOawuipumwyheLf4gZo2MxYKvnQR8cvNm2,TRIPAY_PRIVATE_KEY=LlMVC-n8bGQ-dydmE-QhNaj-nOVEu,TRIPAY_MERCHANT_CODE=T38821,VAPID_PUBLIC_KEY=BKZK8ga5NzReTvy4V-Wdhie30tOjmnRF5lZ3BZsjfK0s-LyIVgTmqViqs4s0pYyacWgg7_CrUPOdCGfOZB3dujQ,VAPID_PRIVATE_KEY=9ALi9_rvpYG_idH2vfun9as3AlNE8Db4srNHee5Wxx0" `
        --quiet

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
        
        # Get service URL
        $serviceUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"
        Write-Host ""
        Write-Host "Service URL: $serviceUrl" -ForegroundColor Green
        Write-Host "Health Check: $serviceUrl/health" -ForegroundColor Cyan
        
        # Test health endpoint
        Write-Host ""
        Write-Host "Testing health endpoint..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri "$serviceUrl/health" -Method Get -TimeoutSec 30
            Write-Host "Health check passed: $($response | ConvertTo-Json)" -ForegroundColor Green
        } catch {
            Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Service might still be starting up..." -ForegroundColor Yellow
        }
        
    } else {
        throw "Deployment failed"
    }
} catch {
    Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your frontend .env.local file with the new service URL" -ForegroundColor White
Write-Host "2. Test your API endpoints" -ForegroundColor White
Write-Host "3. Monitor logs with: gcloud run logs tail $ServiceName --region $Region" -ForegroundColor White

Write-Host ""
Write-Host "Deployment completed successfully! 🚀" -ForegroundColor Green
