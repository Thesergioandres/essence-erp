$ErrorActionPreference = "Stop"

Write-Host "Conectando al servidor..." -ForegroundColor Cyan

# Crear un objeto de credenciales
$securePassword = ConvertTo-SecureString "serra1707" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ("root", $securePassword)

try {
    # Intentar conectar por SSH usando ssh.exe de Windows
    Write-Host "`nEstado de contenedores Docker:" -ForegroundColor Yellow
    ssh root@93.189.89.195 -o StrictHostKeyChecking=no "docker ps -a | grep essence"
    
    Write-Host "`nÚltimos 50 logs del backend:" -ForegroundColor Yellow
    ssh root@93.189.89.195 -o StrictHostKeyChecking=no "docker logs essence-backend --tail 50"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nPresiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
