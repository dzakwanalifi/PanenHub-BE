# Deployment script untuk Google Cloud Run - Asia Southeast Region
# PanenHub Backend Deployment

Write-Host "Deploying PanenHub Backend to Asia Southeast..." -ForegroundColor Green

# Deploy to Asia Southeast region
& "$PSScriptRoot\deploy-cloud-run.ps1" -Region "asia-southeast2" -ProjectId "panenhub-mvp" -ServiceName "panenhub-backend"
