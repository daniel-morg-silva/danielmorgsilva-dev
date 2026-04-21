# Deploying to the Cluster (Option A — Manual)

## One-time setup

### 1. Authenticate with GHCR

Create a GitHub Personal Access Token (PAT) at https://github.com/settings/tokens
with scopes: `read:packages` and `write:packages`

Then log in:

```bash
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2. Make the GHCR package public (easiest option)

After your first push (step 3 below), go to:
`https://github.com/users/YOUR_GITHUB_USERNAME/packages/container/danielmorgsilva-dev/settings`

Set visibility to **Public**. This lets the cluster pull the image without needing an `imagePullSecret`.

If you prefer to keep it private, create a pull secret in the cluster namespace instead:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace danielmorgsilva-dev \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_PAT
```

Then reference it in your Deployment manifest under `spec.template.spec.imagePullSecrets`.

### 3. Initialize the theme submodule (if not done already)

```bash
git submodule update --init --recursive
```

---

## Every deploy

Run all steps below in the same terminal session — the `TAG` and `IMAGE` variables are not persisted between sessions.

### 1. Set your tag and image

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

Flux reconciles within ~1 minute. Force an immediate sync with:

```bash
flux reconcile kustomization <your-kustomization-name>
```

---

## Verify the deploy

```bash
kubectl rollout status deployment/danielmorgsilva-dev -n danielmorgsilva-dev
```

If it fails, check pods and logs:

```bash
kubectl get pods -n danielmorgsilva-dev
kubectl describe pod -n danielmorgsilva-dev <pod-name>
```

Then open your domain in a browser.
