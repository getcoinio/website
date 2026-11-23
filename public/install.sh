#!/bin/sh
# Coinio installer (https://getcoinio.me/install)
#
# What it does, in order:
#   1. checks that Docker is installed and running (it never installs Docker for you)
#   2. pulls the Coinio image and starts it on port 8080, data in the "coinio-data" volume
#   3. optionally starts a Cloudflare Tunnel so you get https without opening ports
#   4. prints the address to open
#
# Source: https://github.com/getcoinio/coinio
set -eu

IMAGE="ghcr.io/getcoinio/coinio:latest"
NAME="coinio"
TUNNEL_NAME="coinio-tunnel"
NETWORK="coinio"
VOLUME="coinio-data"
PORT=8080

say() { printf '%s\n' "$*"; }
die() { printf 'coinio: %s\n' "$*" >&2; exit 1; }

# Ask a question on the terminal, even when this script is piped into sh.
# Prints nothing and answers empty when there is no terminal.
ask() {
  ANSWER=""
  if (: </dev/tty) 2>/dev/null; then
    printf '%s' "$1" >/dev/tty
    read -r ANSWER </dev/tty || ANSWER=""
  fi
}

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Docker is not installed. Install it first, then run this again:" >&2
  say "  https://docs.docker.com/engine/install/" >&2
  say "  (or the quick way: curl -fsSL https://get.docker.com | sh)" >&2
  exit 1
fi
docker info >/dev/null 2>&1 ||
  die "Docker is installed but not reachable. Start it, or run this as root or as a user in the docker group."

# Never overwrite an existing install.
if docker container inspect "$NAME" >/dev/null 2>&1; then
  say "A container named '$NAME' already exists, so nothing was changed."
  say "To update Coinio (your data stays in the '$VOLUME' volume):"
  say "  docker pull $IMAGE"
  say "  docker rm -f $NAME"
  say "  curl -fsSL https://getcoinio.me/install | sh"
  exit 1
fi

# 2. Optional Cloudflare Tunnel: ask now, so the app knows its public address.
TOKEN=""
HOST=""
if docker container inspect "$TUNNEL_NAME" >/dev/null 2>&1; then
  say "Keeping the existing '$TUNNEL_NAME' container."
  TUNNEL=existing
else
  say ""
  say "Cloudflare Tunnel (optional) gives Coinio an https address without opening ports."
  say "The iPhone widget and claude.ai connectors need one. Create a tunnel in the"
  say "Cloudflare dashboard (Zero Trust > Networks > Tunnels) and copy its token."
  ask "Tunnel token (press Enter to skip): "
  TOKEN=$ANSWER
  TUNNEL=$TOKEN
fi
if [ -n "$TUNNEL" ]; then
  ask "Public hostname for Coinio, e.g. coinio.example.com: "
  HOST=$(printf '%s' "$ANSWER" | sed 's#^https\{0,1\}://##; s#/.*$##')
fi

# 3. Coinio
say ""
say "Pulling $IMAGE ..."
docker pull "$IMAGE"

docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null

set -- -d --name "$NAME" --restart unless-stopped --network "$NETWORK" \
  -p "$PORT:8080" -v "$VOLUME:/data"
[ -n "$HOST" ] && set -- "$@" -e "COINIO_PUBLIC_URL=https://$HOST"
docker run "$@" "$IMAGE" >/dev/null
say "Coinio is running."

if [ -n "$TOKEN" ]; then
  docker run -d --name "$TUNNEL_NAME" --restart unless-stopped --network "$NETWORK" \
    cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "$TOKEN" >/dev/null
  say "Cloudflare Tunnel is running."
  say "In the Cloudflare dashboard, add a public hostname to this tunnel"
  say "and point it to the service:  http://coinio:8080"
fi

# 4. Where to go next
IP=$(hostname -I 2>/dev/null | awk '{print $1}') || IP=""
say ""
say "Open Coinio and create your account:"
say "  http://${IP:-localhost}:$PORT"
[ -n "$HOST" ] && say "  https://$HOST  (once the public hostname is set)"
exit 0
