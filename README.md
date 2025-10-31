# myProxy

```yml
services:
  my-node-service:
    image: atom0827/my-proxy:latest
    container_name: my-proxy
    restart: unless-stopped
    network_mode: "host"  # 使用宿主机网络
    environment:
      - HTTP_PROXY=http://user:password@192.168.31.128:7890
      - HTTPS_PROXY=http://user:password@192.168.31.128:7890
      - NO_PROXY=localhost,127.0.0.1
```