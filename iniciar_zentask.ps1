Write-Host "Iniciando ZenTask (Backend + Frontend + Túnel)..." -ForegroundColor Cyan

# 1. Iniciar el Backend (Django) en segundo plano
Write-Host "Levantando base de datos (Puerto 8001)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath ".\backend\venv\Scripts\python.exe" -ArgumentList "backend\manage.py runserver 8001"

# 2. Iniciar el Frontend (Vite) en segundo plano
Write-Host "Levantando interfaz web (Puerto 5173)..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c npm run dev" -WorkingDirectory ".\frontend"

# Esperar unos segundos para que arranquen los servidores
Start-Sleep -Seconds 4

# 3. Lanzar el túnel (localhost.run)
Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "SERVIDORES ACTIVOS. Creando túnel público para tu celular..." -ForegroundColor Green
Write-Host "Copia el enlace que termina en '.lhr.life' que aparecerá abajo:" -ForegroundColor Magenta
Write-Host "========================================================`n" -ForegroundColor Green

ssh -o StrictHostKeyChecking=accept-new -R 80:localhost:5173 nokey@localhost.run
