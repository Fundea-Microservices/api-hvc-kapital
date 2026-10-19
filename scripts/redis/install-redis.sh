#!/usr/bin/env bash
#
# Job de instalación/configuración de Redis para la idempotencia.
#
# - Instala redis-server si no está presente (apt o dnf).
# - Aplica un bloque de configuración gestionado (idempotente) con:
#     bind local, protected-mode, requirepass, appendonly y noeviction.
# - Guarda la contraseña en /etc/hvc-kapital/redis.env (root, 600).
# - Reinicia el servicio y ejecuta el job verificador.
#
# Uso:
#   sudo bash scripts/redis/install-redis.sh
#   sudo bash scripts/redis/install-redis.sh --bind "0.0.0.0 -::1" --port 6379
#   bash scripts/redis/install-redis.sh --dry-run
#
# Opciones:
#   --dry-run           Solo muestra lo que haría (no requiere root).
#   --password VALOR    Usa una contraseña existente (mín. 16 caracteres).
#   --bind VALOR        Direcciones de escucha (default: "127.0.0.1 -::1").
#   --port N            Puerto (default: 6379).
#   --no-password       No exige contraseña (solo aceptable en local).
#   --no-restart        No reinicia el servicio.
#   --no-verify         No ejecuta verify-redis.sh al final.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DRY_RUN=0
PASSWORD="${REDIS_PASSWORD:-}"
BIND_ADDR="127.0.0.1 -::1"
PORT="6379"
USE_PASSWORD=1
RESTART=1
VERIFY=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --password)
      PASSWORD="${2:?Falta la contraseña}"
      shift
      ;;
    --password=*) PASSWORD="${1#*=}" ;;
    --bind)
      BIND_ADDR="${2:?Falta el valor de bind}"
      shift
      ;;
    --bind=*) BIND_ADDR="${1#*=}" ;;
    --port)
      PORT="${2:?Falta el puerto}"
      shift
      ;;
    --port=*) PORT="${1#*=}" ;;
    --no-password) USE_PASSWORD=0 ;;
    --no-restart) RESTART=0 ;;
    --no-verify) VERIFY=0 ;;
    -h|--help)
      sed -n '2,28p' "$0"
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1" >&2
      exit 2
      ;;
  esac
  shift
done

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

if [[ "$DRY_RUN" -eq 0 && "$(id -u)" -ne 0 ]]; then
  echo "Este job necesita root (usa sudo) o --dry-run." >&2
  exit 1
fi

# ─── 1. Instalación ─────────────────────────────────────────────────────────
echo "== 1/4 Instalación de Redis =="
if command -v redis-server >/dev/null 2>&1; then
  echo "[OK] redis-server ya instalado: $(redis-server --version | head -1)"
else
  if command -v apt-get >/dev/null 2>&1; then
    run apt-get update -y
    run env DEBIAN_FRONTEND=noninteractive apt-get install -y redis-server redis-tools
  elif command -v dnf >/dev/null 2>&1; then
    run dnf install -y redis
  elif command -v yum >/dev/null 2>&1; then
    run yum install -y redis
  else
    echo "[FALLO] No se reconoce el gestor de paquetes (apt/dnf/yum)." >&2
    echo "        Instala Redis ≥ 7 manualmente y vuelve a ejecutar el job." >&2
    exit 1
  fi
fi

# ─── 2. Contraseña ──────────────────────────────────────────────────────────
echo
echo "== 2/4 Contraseña =="
ENV_OUT="/etc/hvc-kapital/redis.env"

if [[ "$USE_PASSWORD" -eq 1 ]]; then
  if [[ -z "$PASSWORD" && -f "$ENV_OUT" ]]; then
    PASSWORD="$(grep -E '^REDIS_PASSWORD=' "$ENV_OUT" | tail -1 | cut -d= -f2- || true)"
    [[ -n "$PASSWORD" ]] && echo "[OK] Se reutiliza la contraseña de $ENV_OUT"
  fi

  if [[ -z "$PASSWORD" ]]; then
    if command -v openssl >/dev/null 2>&1; then
      PASSWORD="$(openssl rand -hex 32)"
    else
      PASSWORD="$(tr -dc 'a-f0-9' </dev/urandom | head -c 64)"
    fi
    echo "[OK] Contraseña generada (se guardará en $ENV_OUT)"
  fi

  if [[ ${#PASSWORD} -lt 16 ]]; then
    echo "[FALLO] La contraseña debe tener al menos 16 caracteres." >&2
    exit 1
  fi
  if [[ ! "$PASSWORD" =~ ^[A-Za-z0-9._-]+$ ]]; then
    echo "[FALLO] La contraseña solo puede contener A-Z a-z 0-9 . _ -" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" -eq 0 ]]; then
    install -d -m 750 -o root -g root /etc/hvc-kapital
    umask 077
    {
      echo "REDIS_HOST=127.0.0.1"
      echo "REDIS_PORT=${PORT}"
      echo "REDIS_PASSWORD=${PASSWORD}"
      echo "REDIS_DB=0"
    } > "$ENV_OUT"
    chmod 600 "$ENV_OUT"
    chown root:root "$ENV_OUT"
    echo "[OK] Credenciales guardadas en $ENV_OUT (root, 600)"
    echo "     Copia REDIS_PASSWORD a la variable del mismo nombre en el .env de la API."
  else
    echo "[dry-run] Escribiría $ENV_OUT con REDIS_PASSWORD=<generada>"
  fi
else
  if [[ "$BIND_ADDR" != "127.0.0.1 -::1" ]]; then
    echo "[FALLO] --no-password solo se permite con bind local." >&2
    exit 1
  fi
  PASSWORD=""
  echo "[AVISO] Redis sin contraseña (solo aceptable con bind local)."
fi

# ─── 3. Configuración gestionada ────────────────────────────────────────────
echo
echo "== 3/4 Configuración =="
CONF=""
for candidato in /etc/redis/redis.conf /etc/redis.conf; do
  if [[ -f "$candidato" ]]; then
    CONF="$candidato"
    break
  fi
done

if [[ -z "$CONF" ]]; then
  echo "[FALLO] No se encontró redis.conf (/etc/redis/redis.conf ni /etc/redis.conf)." >&2
  exit 1
fi

INICIO="# >>> hvc-kapital-idempotencia >>>"
FIN="# <<< hvc-kapital-idempotencia <<<"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# Elimina el bloque previo (si existe) y anexa el nuevo: el job es idempotente.
awk -v inicio="$INICIO" -v fin="$FIN" '
  $0 == inicio { dentro = 1; next }
  $0 == fin    { dentro = 0; next }
  !dentro      { print }
' "$CONF" > "$TMP"

{
  echo ""
  echo "$INICIO"
  echo "# Generado por scripts/redis/install-redis.sh. No editar a mano."
  echo "bind ${BIND_ADDR}"
  echo "protected-mode yes"
  echo "port ${PORT}"
  if [[ -n "$PASSWORD" ]]; then
    echo "requirepass ${PASSWORD}"
  fi
  echo "# No desalojar llaves: si Redis expulsa un registro, reaparecen los duplicados."
  echo "maxmemory-policy noeviction"
  echo "# Persistencia: sobrevivir reinicios del servicio."
  echo "appendonly yes"
  echo "appendfsync everysec"
  echo "$FIN"
} >> "$TMP"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] Actualizaría $CONF y reiniciaría el servicio."
  echo "--- bloque que se escribiría (contraseña oculta) ---"
  sed "s/^requirepass .*/requirepass <oculta>/" "$TMP" | tail -20
else
  cp -a "$CONF" "${CONF}.bak.$(date +%Y%m%d%H%M%S)"
  cat "$TMP" > "$CONF"
  # En Debian el paquete crea el usuario redis; si existe, mantenemos el dueño.
  if id redis >/dev/null 2>&1; then
    chown redis:redis "$CONF" 2>/dev/null || true
  fi
  echo "[OK] Bloque aplicado en $CONF (respaldo .bak creado)"
fi

# ─── 4. Servicio y verificación ─────────────────────────────────────────────
echo
echo "== 4/4 Servicio =="
SERVICE=""
if systemctl status redis-server >/dev/null 2>&1 || systemctl list-unit-files redis-server.service >/dev/null 2>&1; then
  SERVICE="redis-server.service"
elif systemctl status redis >/dev/null 2>&1 || systemctl list-unit-files redis.service >/dev/null 2>&1; then
  SERVICE="redis-server.service"
fi

if [[ -z "$SERVICE" ]]; then
  echo "[AVISO] No hay unidad systemd redis-server/redis; se omite el reinicio."
elif [[ "$RESTART" -eq 1 ]]; then
  run systemctl enable "$SERVICE"
  run systemctl restart "$SERVICE"
  if [[ "$DRY_RUN" -eq 0 ]] && systemctl is-active --quiet "$SERVICE"; then
    echo "[OK] Servicio $SERVICE activo"
  elif [[ "$DRY_RUN" -eq 0 ]]; then
    echo "[FALLO] El servicio $SERVICE no arrancó. Revisa: journalctl -u $SERVICE -n 50" >&2
    exit 1
  fi
fi

if [[ "$VERIFY" -eq 1 ]]; then
  echo
  echo "== Verificación =="
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] Ejecutaría scripts/redis/verify-redis.sh"
  else
    REDIS_HOST=127.0.0.1 REDIS_PORT="$PORT" REDIS_PASSWORD="$PASSWORD" \
      bash "${ROOT_DIR}/scripts/redis/verify-redis.sh" --skip-host-checks
  fi
fi

echo
echo "Listo. Siguiente paso: copia REDIS_PASSWORD de $ENV_OUT al .env de la API"
echo "y reinicia la API. Luego envía Idempotency-Key desde el cliente."
