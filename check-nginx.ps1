Write-Host "Verificando logs de Nginx..." -ForegroundColor Cyan

ssh root@93.189.89.195 -o StrictHostKeyChecking=no @"
echo '=== Últimos 30 logs de error de Nginx ==='
docker exec essence-frontend tail -30 /var/log/nginx/essence_error.log

echo ''
echo '=== Estado del backend (debe estar en puerto 5000) ==='
docker exec essence-backend netstat -tlnp | grep 5000 || echo 'Puerto 5000 no está escuchando'

echo ''
echo '=== Test de conectividad desde frontend a backend ==='
docker exec essence-frontend wget -qO- --timeout=2 http://essence-backend:5000/ || echo 'No se puede conectar al backend'
"@
