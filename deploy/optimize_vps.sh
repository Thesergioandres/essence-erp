#!/usr/bin/env bash
set -euo pipefail

# VPS optimization script for keep-alive, TCP fastopen, and swap.
# Run as root or with sudo.

CONFIG_FILE="/etc/nginx/sites-available/default"
SYSCTL_FILE="/etc/sysctl.conf"
SWAP_FILE="/swapfile"
SWAP_SIZE_GB=2

log() {
  echo "[optimize_vps] $1"
}

log "Enabling TCP Fast Open and keep-alive tuning..."

# Add or update sysctl settings
apply_sysctl() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$SYSCTL_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$SYSCTL_FILE"
  else
    echo "${key}=${value}" >> "$SYSCTL_FILE"
  fi
}

apply_sysctl net.ipv4.tcp_fastopen 3
apply_sysctl net.ipv4.tcp_keepalive_time 600
apply_sysctl net.ipv4.tcp_keepalive_intvl 60
apply_sysctl net.ipv4.tcp_keepalive_probes 5

sysctl -p "$SYSCTL_FILE"

log "Ensuring Nginx keepalive settings exist..."
if [ -f "$CONFIG_FILE" ]; then
  if ! grep -q "keepalive_timeout" "$CONFIG_FILE"; then
    echo "" >> "$CONFIG_FILE"
    echo "# Keep-Alive tuning" >> "$CONFIG_FILE"
    echo "keepalive_timeout 65;" >> "$CONFIG_FILE"
    echo "keepalive_requests 1000;" >> "$CONFIG_FILE"
  fi
else
  log "WARN: $CONFIG_FILE not found. Skipping keepalive config update."
fi

log "Checking memory for swap recommendation..."
MEM_TOTAL_MB=$(awk '/MemTotal/ { printf "%d", $2 / 1024 }' /proc/meminfo)
if [ "$MEM_TOTAL_MB" -lt 4096 ]; then
  if [ ! -f "$SWAP_FILE" ]; then
    log "Creating ${SWAP_SIZE_GB}GB swap file..."
    fallocate -l ${SWAP_SIZE_GB}G "$SWAP_FILE"
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE"
    swapon "$SWAP_FILE"
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    log "Swap created and enabled."
  else
    log "Swap file already exists, skipping creation."
  fi
else
  log "RAM is >= 4GB. Swap creation not required."
fi

log "Audit: server.js should listen on PORT 5000 (check env)."
log "Audit: restrict CORS allowed origins to your domain in server/server.js."

log "Done. Remember to run: nginx -t && systemctl restart nginx"
