#!/usr/bin/env bash
#
# Job verificador de Redis (idempotencia de la API).
#
# Comprueba la instalación local (binarios y servicio systemd) y después
# ejecuta la verificación funcional en Node (conexión, escritura, TTL, Lua y
# política de memoria). No modifica nada.
#
# Uso:
#   bash scripts/redis/verify-redis.sh
#   bash scripts/redis/verify-redis.sh --skip-host-checks   # Redis remoto/Docker
#   bash scripts/redis/verify-redis.sh --env-file /ruta/.env
#
# Salidas:
#   0 = correcto (puede haber advertencias)
#   1 = fallo funcional/de configuración
#   2 = Redis no instalado o servicio inactivo (ejecutar install-redis.sh)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
SKIP_HOST_CHECKS=0
HOST="${REDIS_HOST:-}"
PORT="${REDIS_PORT:-}"
PASSWORD="${REDIS_PASSWORD:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-host-checks) SKIP_HOST_CHECKS=1 ;;
    --env-file)
      ENV_FILE="${2:?Falta la ruta del archivo}"
      shift
      ;;
    --env-file=*) ENV_FILE="${1#*=}" ;;
    --host)
      HOST="${2:?Falta el host}"
      shift
      ;;
    --host=*) HOST="${1#*=}" ;;
    --port)
      PORT="${2:?Falta el puerto}"
      shift
      ;;
    --port=*) PORT="${1#*=}" ;;
    --password)
      PASSWORD="${2:?Falta la contraseña}"
      shift
      ;;
    --password=*) PASSWORD="${1#*=}" ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1" >&2
      exit 2
      ;;
  esac
  shift
done

# Los valores pasados por CLI mandan; si no, se leen del .env sin ejecutarlo.
if [[ -f "$ENV_FILE" ]]; then
  if [[ -z "$HOST" ]]; then
    HOST="$(grep -E '^REDIS_HOST=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
  fi
  if [[ -z "$PORT" ]]; then
    PORT="$(grep -E '^REDIS_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
  fi
  if [[ -z "$PASSWORD" ]]; then
    PASSWORD="$(grep -E '^REDIS_PASSWORD=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '"'"'"'' || true)"
  fi
fi
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-6379}"
export REDIS_HOST="$HOST" REDIS_PORT="$PORT" REDIS_PASSWORD="$PASSWORD"

echo "== Verificación de instalación de Redis =="
echo "Host: ${HOST}:${PORT}"
echo

if [[ "$SKIP_HOST_CHECKS" -eq 0 ]]; then
  if ! command -v redis-server >/dev/null 2>&1; then
    echo "[FALLO] redis-server no está instalado en este host." >&2
    echo "        Ejecuta el job de instalación: sudo bash scripts/redis/install-redis.sh" >&2
    exit 2
  fi
  echo "[OK] redis-server: $(redis-server --version | head -1)"

  if command -v redis-cli >/dev/null 2>&1; then
    echo "[OK] redis-cli disponible"
  else
    echo "[AVISO] redis-cli no está instalado; se omite el PING local"
  fi

  SERVICE=""
  for candidato in redis-server redis; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${candidato}\.service"; then
      SERVICE="$candidato"
      break
    fi
  done

  if [[ -z "$SERVICE" ]]; then
    echo "[AVISO] No se encontró una unidad systemd redis-server/redis."
    echo "        Si Redis corre en Docker o gestionado, usa --skip-host-checks."
  elif systemctl is-active --quiet "$SERVICE"; then
    echo "[OK] Servicio ${SERVICE}: activo"
  else
    echo "[FALLO] Servicio ${SERVICE}: inactivo" >&2
    echo "        sudo systemctl enable --now ${SERVICE}" >&2
    exit 2
  fi

  if command -v redis-cli >/dev/null 2>&1; then
    if REDISCLI_AUTH="$PASSWORD" redis-cli -h "$HOST" -p "$PORT" --no-auth-warning ping 2>/dev/null | grep -q PONG; then
      echo "[OK] redis-cli PING → PONG"
    else
      echo "[FALLO] redis-cli no pudo autenticarse o no hay respuesta." >&2
      echo "        Revisa REDIS_PASSWORD y el requirepass del servidor." >&2
      exit 1
    fi
  fi
  echo
else
  echo "[INFO] Comprobaciones locales omitidas (--skip-host-checks)."
  echo
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[FALLO] Node no está disponible para la verificación funcional." >&2
  exit 1
fi

node "${ROOT_DIR}/scripts/redis/verify-redis.js" --env-file "$ENV_FILE"
