#!/bin/bash

# 镜像名
IMAGE_NAME="atom0827/my-proxy"
TAG="latest"
BUILDER_NAME="mybuilder"
# 创建 buildx builder（只需创建一次），使用宿主机网络

# docker buildx create \
#   --name mybuilder \
#   --use \
#   --driver docker-container  \
#   --buildkitd-flags '--oci-worker-net host' \
#   --bootstrap || true

# 构建多平台镜像并推送
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t $IMAGE_NAME:$TAG \
  .
  # --platform linux/amd64,linux/arm64 \