@echo off
echo Conectando al servidor de produccion...
echo.

REM Ver logs del servidor
echo === LOGS DEL SERVIDOR ===
plink -batch -pw serra1707 root@93.189.89.195 "cd /home/deploy/app && docker-compose logs --tail=30 server"

echo.
echo === ESTADO DE CONTENEDORES ===
plink -batch -pw serra1707 root@93.189.89.195 "cd /home/deploy/app && docker-compose ps"

echo.
pause
