# Script para verificar servidor de producción
$server = "93.189.89.195"
$user = "root"
$password = "serra1707"

Write-Host "=== VERIFICANDO SERVIDOR DE PRODUCCIÓN ===" -ForegroundColor Cyan
Write-Host ""

# Comando para ver logs del servidor
$command1 = "cd /home/deploy/app && docker-compose logs --tail=30 server 2>&1"

Write-Host "Ejecutando: docker-compose logs..." -ForegroundColor Yellow
$result1 = echo $password | ssh -o StrictHostKeyChecking=no -tt $user@$server $command1 2>&1

Write-Host $result1
Write-Host ""

# Comando para ver estado de contenedores
$command2 = "cd /home/deploy/app && docker-compose ps 2>&1"

Write-Host "Ejecutando: docker-compose ps..." -ForegroundColor Yellow
$result2 = echo $password | ssh -o StrictHostKeyChecking=no -tt $user@$server $command2 2>&1

Write-Host $result2
Write-Host ""

# Comando para ver estructura de directorios
$command3 = "cd /home/deploy/app && ls -la 2>&1"

Write-Host "Ejecutando: ls -la..." -ForegroundColor Yellow
$result3 = echo $password | ssh -o StrictHostKeyChecking=no -tt $user@$server $command3 2>&1

Write-Host $result3
