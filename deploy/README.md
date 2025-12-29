# Despliegue en Clouding (VM) — Guía rápida

Este directorio contiene herramientas y ejemplos para desplegar la aplicación en una VM de Clouding usando Docker Compose.

Requisitos en la VM:

- Docker
- Docker Compose
- Usuario con acceso SSH

Pasos recomendados:

1. Crear VM en Clouding y añadir tu clave SSH.
2. Instalar Docker/Docker Compose en la VM (ej. Ubuntu):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

3. Desde tu máquina local ejecutar (ejemplo):

```bash
# Bash (Linux / macOS / WSL)
./deploy/deploy-to-clouding.sh user@IP:/home/user/app

# PowerShell (Windows)
.
\deploy\deploy-to-clouding.ps1 -RemoteFull "user@IP:/home/user/app"
```

4. Opcional: configurar unidad systemd con `deploy/systemd.service.example` para lanzar la app al iniciar la VM.

Consideraciones:

- Asegura las variables de entorno en un `.env` en la VM.
- Protege el acceso SSH y configura firewall (ufw) si es necesario.
- Para HTTPS, añade Nginx o Traefik en la VM y genera certificados con Let's Encrypt.

Si quieres, puedo generar un playbook más automatizado (Ansible) o un script que cree la VM en Clouding y la configure automáticamente.
