# Sports Academy - Start Backend Only

Write-Host "Starting Django Backend Server..." -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Green
Write-Host "Admin Panel: http://localhost:8000/admin" -ForegroundColor Green
Write-Host ""

cd backend
.\venv\Scripts\python manage.py runserver
