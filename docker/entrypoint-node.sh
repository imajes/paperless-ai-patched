#!/bin/sh
set -eu

APP_USER="${APP_USER:-node}"
APP_GROUP="${APP_GROUP:-node}"

ensure_numeric() {
  value="$1"
  name="$2"
  case "$value" in
    ''|*[!0-9]*)
      echo "[ERROR] ${name} must be numeric. Got: ${value}" >&2
      exit 1
      ;;
  esac
}

if [ "$(id -u)" -eq 0 ]; then
  if [ -n "${PGID:-}" ]; then
    ensure_numeric "$PGID" "PGID"
    current_gid="$(id -g "$APP_GROUP")"
    if [ "$PGID" != "$current_gid" ]; then
      groupmod -o -g "$PGID" "$APP_GROUP"
    fi
  fi

  if [ -n "${PUID:-}" ]; then
    ensure_numeric "$PUID" "PUID"
    current_uid="$(id -u "$APP_USER")"
    if [ "$PUID" != "$current_uid" ]; then
      usermod -o -u "$PUID" "$APP_USER"
    fi
  fi

  mkdir -p /app/data /app/logs
  chown -R "$APP_USER:$APP_GROUP" /app/data /app/logs 2>/dev/null || true

  exec gosu "$APP_USER:$APP_GROUP" "$@"
fi

exec "$@"
