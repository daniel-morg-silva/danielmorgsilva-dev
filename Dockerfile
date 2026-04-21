# Stage 1: Build
FROM node:22-bookworm-slim AS builder

ARG HUGO_VERSION=0.152.2

RUN ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') && \
    apt-get update && apt-get install -y --no-install-recommends wget tar ca-certificates && \
    wget -O /tmp/hugo.tar.gz \
      "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-${ARCH}.tar.gz" && \
    tar -xzf /tmp/hugo.tar.gz -C /tmp && \
    mv /tmp/hugo /usr/local/bin/hugo && \
    chmod +x /usr/local/bin/hugo && \
    rm /tmp/hugo.tar.gz && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN hugo --minify

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /src/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
