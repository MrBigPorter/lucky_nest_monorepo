#!/usr/bin/env bash
# ============================================================
# 本地构建 + 远程部署脚本
# ============================================================
# 策略: 在本地 Mac 构建 Docker 镜像 (内存充足)
#        → 传输到 1GB VPS (避免服务器 OOM)
#
# 使用方法:
#   ./deploy/deploy.sh              # 全量部署
#   ./deploy/deploy.sh --backend    # 仅后端
#   ./deploy/deploy.sh --admin      # 仅前端
#   ./deploy/deploy.sh --quick      # 跳过构建, 仅重启服务
#   ./deploy/deploy.sh --sync       # 仅同步配置文件
# ============================================================
set -euo pipefail

# ---- 配置 ----
VPS_IP="192.210.207.88"
VPS_USER="root"
VPS_DIR="/opt/lucky"
SSH_TARGET="${VPS_USER}@${VPS_IP}"

# 镜像名称
BACKEND_IMAGE="lucky-backend-prod:latest"
ADMIN_IMAGE="lucky-admin-builder:latest"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---- 解析参数 ----
BUILD_BACKEND=true
BUILD_ADMIN=true
SKIP_BUILD=false
SYNC_ONLY=false

for arg in "$@"; do
    case $arg in
        --backend) BUILD_ADMIN=false ;;
        --admin)   BUILD_BACKEND=false ;;
        --quick)   SKIP_BUILD=true ;;
        --sync)    SYNC_ONLY=true ;;
        --help)
            echo "用法: ./deploy/deploy.sh [选项]"
            echo "  --backend   仅构建/部署后端"
            echo "  --admin     仅构建/部署前端"
            echo "  --quick     跳过构建, 仅重启服务"
            echo "  --sync      仅同步配置文件"
            exit 0
            ;;
        *) err "未知参数: $arg" ;;
    esac
done

# ---- 确认当前在项目根目录 ----
if [ ! -f "compose.prod.yml" ]; then
    err "请在项目根目录执行此脚本"
fi

# ---- SSH 连通性检查 ----
log "检查 SSH 连接 → $SSH_TARGET..."
ssh -o ConnectTimeout=5 "$SSH_TARGET" "echo 'SSH OK'" || err "无法连接到 $SSH_TARGET"

# ============================================================
# Step 1: 同步配置文件到 VPS
# ============================================================
sync_configs() {
    log "同步配置文件..."

    # 确保目录存在
    ssh "$SSH_TARGET" "mkdir -p $VPS_DIR/{certs,nginx/html,redis,deploy}"

    # 核心配置
    scp compose.prod.yml                    "$SSH_TARGET:$VPS_DIR/"
    scp deploy/.env.prod                    "$SSH_TARGET:$VPS_DIR/deploy/"
    scp nginx/nginx.prod.conf               "$SSH_TARGET:$VPS_DIR/nginx/"
    scp nginx/whitelist.conf                "$SSH_TARGET:$VPS_DIR/nginx/"
    scp redis/redis.conf                    "$SSH_TARGET:$VPS_DIR/redis/"

    # 静态文件目录 (如果存在)
    if [ -d "nginx/html" ] && [ "$(ls -A nginx/html 2>/dev/null)" ]; then
        scp -r nginx/html/ "$SSH_TARGET:$VPS_DIR/nginx/"
    fi

    log "✅ 配置文件同步完成"
}

sync_configs

if [ "$SYNC_ONLY" = true ]; then
    log "仅同步模式, 退出"
    exit 0
fi

# ============================================================
# Step 2: 构建 Docker 镜像 (本地, linux/amd64)
# ============================================================
if [ "$SKIP_BUILD" = false ]; then
    log "开始本地构建 (--platform linux/amd64)..."

    if [ "$BUILD_BACKEND" = true ]; then
        log "构建后端镜像: $BACKEND_IMAGE"
        docker build \
            --platform linux/amd64 \
            -f Dockerfile.prod \
            -t "$BACKEND_IMAGE" \
            .
        log "✅ 后端镜像构建完成"
    fi

    if [ "$BUILD_ADMIN" = true ]; then
        log "构建前端镜像: $ADMIN_IMAGE"
        docker build \
            --platform linux/amd64 \
            -f apps/mini-shop-admin/Dockerfile.prod \
            -t "$ADMIN_IMAGE" \
            .
        log "✅ 前端镜像构建完成"
    fi
fi

# ============================================================
# Step 3: 传输镜像到 VPS (docker save | ssh docker load)
# ============================================================
if [ "$SKIP_BUILD" = false ]; then
    log "传输镜像到 VPS (压缩传输)..."

    IMAGES_TO_SEND=""
    [ "$BUILD_BACKEND" = true ] && IMAGES_TO_SEND="$BACKEND_IMAGE"
    [ "$BUILD_ADMIN" = true ]   && IMAGES_TO_SEND="$IMAGES_TO_SEND $ADMIN_IMAGE"
    IMAGES_TO_SEND=$(echo "$IMAGES_TO_SEND" | xargs)  # trim

    if [ -n "$IMAGES_TO_SEND" ]; then
        log "传输: $IMAGES_TO_SEND"
        docker save $IMAGES_TO_SEND | gzip | \
            ssh "$SSH_TARGET" "gunzip | docker load"
        log "✅ 镜像传输完成"
    fi
fi

# ============================================================
# Step 4: 在 VPS 上启动/更新服务
# ============================================================
log "在 VPS 上启动服务..."

ssh "$SSH_TARGET" << REMOTE_SCRIPT
    set -e
    cd $VPS_DIR

    echo "→ 当前镜像:"
    docker images | grep lucky || true

    echo "→ 拉取基础镜像 (nginx, redis, postgres)..."
    docker compose -f compose.prod.yml --env-file deploy/.env.prod pull nginx redis db 2>/dev/null || true

    # 如果部署了 admin 镜像, 使用 --profile local 启动 admin-builder
    COMPOSE_CMD="docker compose -f compose.prod.yml --env-file deploy/.env.prod"
    if docker images --format '{{.Repository}}' | grep -q 'lucky-admin-builder'; then
        COMPOSE_CMD="\$COMPOSE_CMD --profile local"
        echo "→ 检测到 admin 镜像, 启用 admin-builder (--profile local)"
    fi

    echo "→ 启动/更新服务 (不在服务器上构建)..."
    \$COMPOSE_CMD up -d --no-build --force-recreate

    echo "→ 等待服务健康..."
    sleep 5

    echo "→ 服务状态:"
    docker compose -f compose.prod.yml ps

    echo "→ 清理旧镜像..."
    docker image prune -f

    echo "→ 系统资源:"
    free -h
    df -h /
REMOTE_SCRIPT

log "✅ 部署完成！"
echo ""
echo -e "${CYAN}验证:${NC}"
echo "  curl -k https://$VPS_IP/api/v1/health"
echo "  ssh $SSH_TARGET 'docker compose -f $VPS_DIR/compose.prod.yml logs -f'"
echo ""

