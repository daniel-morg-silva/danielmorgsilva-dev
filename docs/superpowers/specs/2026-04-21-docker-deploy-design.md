# Deploy danielmorgsilva-dev to Kubernetes — Option A (Manual)

## Summary

Package the Hugo site as a Docker image and deploy it to the existing K3s/Flux cluster manually. CI/CD automation (Option B) is a future upgrade; this spec covers the manual flow only.

## Dockerfile (multi-stage)

- **Stage 1** — `hugomods/hugo:base`: copies the repo, runs `hugo --minify`, outputs built site to `/public`
- **Stage 2** — `nginx:alpine`: copies `/public` from stage 1 into `/usr/share/nginx/html`, includes a minimal `nginx.conf` with 404 fallback to Hugo's custom 404 page
- Final image is ~25 MB; no Hugo binary in the production image

## nginx.conf

Minimal config: serves static files, falls back to Hugo's `404.html` for unknown paths, no directory listing.

## Manual build & push workflow

Each time the site is updated:

1. `docker build -t ghcr.io/<github-username>/danielmorgsilva-dev:<tag> .`
   - Tag convention: `v1`, `v2`, … or `YYYY-MM-DD`
2. `docker push ghcr.io/<github-username>/danielmorgsilva-dev:<tag>`
3. Update the image tag in the HomeLab Flux manifest
4. `git commit && git push` → Flux reconciles within ~1 minute

One-time setup: `docker login ghcr.io` with a GitHub PAT (`write:packages` scope).

## Kubernetes manifests

Out of scope for this repo — handled directly in the HomeLab repo by the developer. Expected structure: `apps/danielmorgsilva-dev/{namespace,deployment,service,ingress}.yaml`.

## Deliverables

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Hugo → nginx build |
| `nginx.conf` | Minimal static-file server config |
| `DEPLOY.md` | Step-by-step manual deploy instructions |

## Future upgrade path (Option B)

The same `Dockerfile` works unchanged in GitHub Actions. The upgrade adds: a workflow that builds and pushes on every push to `main`, plus Flux Image Automation to detect new tags and update the manifest automatically.
