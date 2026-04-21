# Docker Deploy (Option A — Manual) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the Hugo site as a Docker image (Hugo → nginx, multi-stage) and document the manual build/push/deploy workflow for the K3s/Flux cluster.

**Architecture:** A multi-stage Dockerfile builds the site using Hugo extended + Node.js (for Tailwind) and copies the output into an nginx:alpine image. A `.dockerignore` keeps the build context small. A `DEPLOY.md` documents the full manual workflow.

**Tech Stack:** Hugo v0.152.2 extended, Node.js 22, nginx:alpine, GHCR

---

## Files

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `Dockerfile` | Multi-stage Hugo → nginx build |
| Create | `nginx.conf` | Static file server with 404 fallback |
| Create | `.dockerignore` | Exclude public/, node_modules/, etc. from build context |
| Create | `DEPLOY.md` | Step-by-step manual build/push/deploy instructions |

---

### Task 1: Create nginx.conf and .dockerignore

**Files:**
- Create: `nginx.conf`
- Create: `.dockerignore`

- [ ] **Step 1: Write nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    error_page 404 /404.html;

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Save to `nginx.conf` at the repo root.

- [ ] **Step 2: Write .dockerignore**

```
public/
node_modules/
resources/
.git/
.github/
docs/
tools/
*.md
```

Save to `.dockerignore` at the repo root.

---

### Task 2: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

ARG HUGO_VERSION=0.152.2

RUN apk add --no-cache wget tar && \
    wget -O /tmp/hugo.tar.gz \
      "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" && \
    tar -C /usr/local/bin -xf /tmp/hugo.tar.gz hugo && \
    rm /tmp/hugo.tar.gz

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
```

Save to `Dockerfile` at the repo root.

**Note:** The theme submodule (`themes/hugo-profile`) must be initialized locally before running `docker build`. Run `git submodule update --init --recursive` if you haven't already.

---

### Task 3: Verify the build locally

**Prerequisites:** Docker running, theme submodule initialized (`git submodule update --init --recursive`).

- [ ] **Step 1: Build the image**

```bash
docker build -t danielmorgsilva-dev:local .
```

Expected: build completes, final image printed. No errors. Hugo should report the number of pages built (e.g. `Built in X ms`).

If the build fails at the Hugo step, check the output for missing files. Common issue: theme submodule not initialized — run `git submodule update --init --recursive` and rebuild.

- [ ] **Step 2: Run the container**

```bash
docker run --rm -p 8080:80 danielmorgsilva-dev:local
```

Expected: nginx starts, no errors in stdout.

- [ ] **Step 3: Verify the site serves correctly**

Open a second terminal and run:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

Expected output: `200`

- [ ] **Step 4: Verify 404 handling**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/does-not-exist
```

Expected output: `404`

- [ ] **Step 5: Stop the container**

Press `Ctrl+C` in the terminal running the container.

---

### Task 4: Write DEPLOY.md

**Files:**
- Create: `DEPLOY.md`

- [ ] **Step 1: Write DEPLOY.md**

```markdown
# Deploying to the Cluster (Option A — Manual)

## One-time setup

### 1. Authenticate with GHCR

Create a GitHub Personal Access Token (PAT) at https://github.com/settings/tokens
with scope: `write:packages`

Then log in:

```bash
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2. Initialize the theme submodule (if not done already)

```bash
git submodule update --init --recursive
```

---

## Every deploy

### 1. Pick a tag

Use a version number (`v1`, `v2`, …) or a date (`2026-04-21`). Keep it consistent.

```bash
TAG=v1   # change this each deploy
IMAGE=ghcr.io/YOUR_GITHUB_USERNAME/danielmorgsilva-dev
```

### 2. Build the Docker image

```bash
docker build -t $IMAGE:$TAG .
```

### 3. Push to GHCR

```bash
docker push $IMAGE:$TAG
```

### 4. Update the image tag in your HomeLab repo

In your HomeLab repo, find the Deployment manifest for this site and update the image tag:

```yaml
image: ghcr.io/YOUR_GITHUB_USERNAME/danielmorgsilva-dev:v1  # ← update this
```

### 5. Commit and push the HomeLab repo

```bash
git add apps/danielmorgsilva-dev/deployment.yaml
git commit -m "chore: bump danielmorgsilva-dev to $TAG"
git push
```

Flux reconciles within ~1 minute and pulls the new image.

---

## Verify the deploy

```bash
kubectl rollout status deployment/danielmorgsilva-dev -n danielmorgsilva-dev
```

Then open your domain in a browser.
```

Save to `DEPLOY.md` at the repo root.

---

### Task 5: Commit

- [ ] **Step 1: Stage and commit all new files**

```bash
git add Dockerfile nginx.conf .dockerignore DEPLOY.md
git commit -m "feat: add Dockerfile and manual deploy workflow"
```

Expected: commit succeeds, 4 files added.
