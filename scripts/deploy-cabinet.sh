#!/usr/bin/env bash
set -euo pipefail

# Deploy cabinet-frontend static build to cabinet.salfetka5.com.
#
# Steps:
#   1. docker compose build
#   2. Create a throwaway container from the built image
#   3. Copy /usr/share/nginx/html out as ./cabinet-dist
#   4. rsync it to the remote host
#   5. Restart docker compose on the remote host

DEPLOY_SSH_TARGET="${DEPLOY_SSH_TARGET:-root@cabinet.salfetka5.com}"
REMOTE_DIR="${REMOTE_DIR:-/opt/remnawave-cabinet}"
REMOTE_DIST="${REMOTE_DIST:-${REMOTE_DIR}/cabinet-dist}"
TMP_CONTAINER="${TMP_CONTAINER:-tmp_cabinet_$$}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_DIST="${REPO_ROOT}/cabinet-dist"

cd "$REPO_ROOT"

log() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }

cleanup() {
  if docker inspect "$TMP_CONTAINER" >/dev/null 2>&1; then
    docker rm -f "$TMP_CONTAINER" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

log "Building image via docker compose"
docker compose build

IMAGE="$(docker compose config --images | head -n1)"
if [[ -z "$IMAGE" ]]; then
  echo "Failed to resolve built image name" >&2
  exit 1
fi
log "Built image: $IMAGE"

log "Extracting static files to $LOCAL_DIST"
rm -rf "$LOCAL_DIST"
docker create --name "$TMP_CONTAINER" "$IMAGE" >/dev/null
docker cp "$TMP_CONTAINER":/usr/share/nginx/html "$LOCAL_DIST"
docker rm "$TMP_CONTAINER" >/dev/null

log "Uploading to ${DEPLOY_SSH_TARGET}:${REMOTE_DIST}"
ssh "$DEPLOY_SSH_TARGET" "mkdir -p '${REMOTE_DIST}'"
rsync -az --delete "${LOCAL_DIST}/" "${DEPLOY_SSH_TARGET}:${REMOTE_DIST}/"

log "Restarting docker compose in ${REMOTE_DIR}"
ssh "$DEPLOY_SSH_TARGET" "cd '${REMOTE_DIR}' && docker-compose down && docker-compose up -d"

log "Done."
