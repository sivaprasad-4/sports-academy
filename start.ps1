# Sports Academy - Quick Start Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sports Academy Management System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create superuser if needed
Write-Host "Creating admin user..." -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor Green
Write-Host "Email: admin@sportsacademy.com" -ForegroundColor Green
Write-Host "Password: admin123" -ForegroundColor Green
Write-Host ""

$env:DJANGO_SUPERUSER_USERNAME = "admin"
$env:DJANGO_SUPERUSER_EMAIL = "admin@sportsacademy.com"
$env:DJANGO_SUPERUSER_PASSWORD = "admin123"

Set-Location backend
.\venv\Scripts\python manage.py createsuperuser --noinput 2>$null

Write-Host "✓ Admin user created (or already exists)" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Admin Panel: http://localhost:8000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Red
Write-Host ""

# Start backend in background
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\venv\Scripts\python manage.py runserver" -PassThru

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Set-Location ..\frontend
npm run dev

# Cleanup on exit
Stop-Process -Id $backend.Id -Force
