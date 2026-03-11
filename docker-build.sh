#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 读取版本号
VERSION=$(grep '^version' Cargo.toml | head -1 | sed 's/version = "\(.*\)"/\1/')
echo -e "${GREEN}当前版本: ${VERSION}${NC}"

# 默认镜像仓库和名称
DEFAULT_REGISTRY="docker.io"
DEFAULT_IMAGE_NAME="kiro-rs"

# 读取用户输入
read -p "镜像仓库地址 (默认: ${DEFAULT_REGISTRY}): " REGISTRY
REGISTRY=${REGISTRY:-$DEFAULT_REGISTRY}

read -p "镜像名称 (默认: ${DEFAULT_IMAGE_NAME}): " IMAGE_NAME
IMAGE_NAME=${IMAGE_NAME:-$DEFAULT_IMAGE_NAME}

read -p "Docker Hub 用户名 (留空则不使用命名空间): " USERNAME
if [ -z "$USERNAME" ]; then
    FULL_IMAGE_NAME="${IMAGE_NAME}"
else
    FULL_IMAGE_NAME="${USERNAME}/${IMAGE_NAME}"
fi

# 是否启用敏感日志
read -p "是否启用敏感日志? (y/N): " ENABLE_SENSITIVE
ENABLE_SENSITIVE=${ENABLE_SENSITIVE:-N}

BUILD_ARGS=""
if [[ "$ENABLE_SENSITIVE" =~ ^[Yy]$ ]]; then
    BUILD_ARGS="--build-arg ENABLE_SENSITIVE_LOGS=true"
    echo -e "${YELLOW}警告: 已启用敏感日志，仅用于排障！${NC}"
fi

# 是否使用代理
read -p "是否使用代理构建? (y/N): " USE_PROXY
USE_PROXY=${USE_PROXY:-N}

if [[ "$USE_PROXY" =~ ^[Yy]$ ]]; then
    read -p "HTTP 代理地址 (例如 http://127.0.0.1:7890): " HTTP_PROXY_URL
    if [ -n "$HTTP_PROXY_URL" ]; then
        BUILD_ARGS="${BUILD_ARGS} --build-arg HTTP_PROXY=${HTTP_PROXY_URL}"
        BUILD_ARGS="${BUILD_ARGS} --build-arg HTTPS_PROXY=${HTTP_PROXY_URL}"
        BUILD_ARGS="${BUILD_ARGS} --build-arg http_proxy=${HTTP_PROXY_URL}"
        BUILD_ARGS="${BUILD_ARGS} --build-arg https_proxy=${HTTP_PROXY_URL}"
        echo -e "${GREEN}已配置代理: ${HTTP_PROXY_URL}${NC}"
    fi
fi

# 询问构建平台
echo -e "${YELLOW}选择构建平台:${NC}"
echo "1) 仅当前平台 (快速)"
echo "2) linux/amd64,linux/arm64 (多平台，需要 buildx)"
read -p "请选择 (1/2, 默认: 1): " PLATFORM_CHOICE
PLATFORM_CHOICE=${PLATFORM_CHOICE:-1}

# 构建镜像
echo -e "${GREEN}开始构建 Docker 镜像...${NC}"
echo "镜像标签: ${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
echo "镜像标签: ${REGISTRY}/${FULL_IMAGE_NAME}:latest"

if [ "$PLATFORM_CHOICE" = "2" ]; then
    echo -e "${YELLOW}使用多平台构建 (linux/amd64,linux/arm64)${NC}"
    docker buildx build ${BUILD_ARGS} \
        --platform linux/amd64,linux/arm64 \
        -t "${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}" \
        -t "${REGISTRY}/${FULL_IMAGE_NAME}:latest" \
        --push \
        .

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 多平台镜像构建并推送成功！${NC}"
        echo ""
        echo "镜像地址:"
        echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
        echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:latest"
        echo ""
        echo -e "${GREEN}完成！${NC}"
        exit 0
    else
        echo -e "${RED}✗ 多平台镜像构建失败${NC}"
        echo -e "${YELLOW}提示: 确保已启用 Docker Buildx: docker buildx create --use${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}使用当前平台构建${NC}"
    docker build ${BUILD_ARGS} \
        -t "${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}" \
        -t "${REGISTRY}/${FULL_IMAGE_NAME}:latest" \
        .
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 镜像构建成功！${NC}"
else
    echo -e "${RED}✗ 镜像构建失败${NC}"
    exit 1
fi

# 询问是否推送
read -p "是否推送镜像到仓库? (y/N): " PUSH
PUSH=${PUSH:-N}

if [[ "$PUSH" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}开始推送镜像...${NC}"

    # 登录 Docker 仓库
    if [ "$REGISTRY" = "docker.io" ]; then
        echo "请登录 Docker Hub:"
        docker login
    else
        echo "请登录镜像仓库 ${REGISTRY}:"
        docker login "${REGISTRY}"
    fi

    # 推送镜像
    docker push "${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
    docker push "${REGISTRY}/${FULL_IMAGE_NAME}:latest"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 镜像推送成功！${NC}"
        echo ""
        echo "镜像地址:"
        echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
        echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:latest"
    else
        echo -e "${RED}✗ 镜像推送失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}跳过推送，镜像已保存在本地${NC}"
    echo ""
    echo "本地镜像:"
    echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
    echo "  ${REGISTRY}/${FULL_IMAGE_NAME}:latest"
fi

echo ""
echo -e "${GREEN}完成！${NC}"
echo ""
echo "使用方法:"
echo "  docker run -d \\"
echo "    -p 8990:8990 \\"
echo "    -v \$(pwd)/config:/app/config \\"
echo "    ${REGISTRY}/${FULL_IMAGE_NAME}:${VERSION}"
