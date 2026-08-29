# Replay — Free Production Deployment & MVP Distribution Guide

> **Goal:** Deploy the Replay MVP (Web App, Go Backend, Database, S3 Storage) completely **FREE** using modern cloud platforms (Vercel + Render + Supabase + Cloudflare R2 / MinIO) and distribute the CLI to users.

---

## 🏗️ Free Production Stack Architecture

| Component | Platform | Free Tier Specifications |
|---|---|---|
| **Web Frontend** | [Vercel](https://vercel.com) | Unlimited bandwidth, automatic HTTPS, continuous deployment from GitHub |
| **Go Backend API** | [Render](https://render.com) or [Koyeb](https://koyeb.com) | Free Web Service (Docker / Go runtime), HTTPS included |
| **PostgreSQL + pgvector** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) | 500 MB free managed Postgres database with `pgvector` extension |
| **Blob Storage (S3)** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) or Supabase | 10 GB free monthly storage, $0 egress fees |
| **CLI Distribution** | [GitHub Releases](https://github.com) | Free binary artifact hosting |

---

## Step 1: Database Setup (Supabase / Managed Postgres)

1. Create a free account at [Supabase](https://supabase.com) or [Neon.tech](https://neon.tech).
2. Create a new PostgreSQL database project (e.g. `replay-prod`).
3. Copy your database connection string URI:
   ```
   postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

---

## Step 2: Backend API Deployment (Render)

1. Sign in to [Render.com](https://render.com) with GitHub.
2. Click **New +** → **Web Service** and select your `Nathanim1919/replay` repository.
3. Configure the service:
   - **Name:** `replay-backend`
   - **Environment:** `Docker` (uses root `Dockerfile`)
   - **Region:** Choose nearest location
   - **Instance Type:** `Free`
4. Add **Environment Variables**:

   | Variable | Example Value | Description |
   |---|---|---|
   | `PORT` | `8080` | Service port |
   | `DB_DRIVER` | `postgres` | Database driver |
   | `DATABASE_URL` | `postgres://...` | Connection URI from Step 1 |
   | `BLOB_STORAGE` | `local` (or `s3`) | Storage mode |
   | `JWT_SECRET` | `generate_random_secure_key_here` | JWT Signing key |

5. Click **Deploy Web Service**. Render built the Go container and provided your live API URL:
   `https://replay-backend-dq8p.onrender.com`

---

## Step 3: Web Frontend Deployment (Vercel)

1. Sign in to [Vercel](https://vercel.com) with GitHub.
2. Click **Add New** → **Project** and select `Nathanim1919/replay`.
3. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `web`
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://replay-backend-dq8p.onrender.com`
5. Click **Deploy**. Vercel will build and deploy your web app to a live URL:
   `https://replay-space.vercel.app`

---

## Step 4: Cross-Compile CLI Binaries with Live Server Target

To ensure the CLI automatically talks to your free production backend out of the box, build the binaries with the `SERVER_URL` embedded via `make release-cli`:

```bash
# Build multi-platform CLI binaries pointing to your Render backend
make release-cli SERVER_URL=https://replay-backend-dq8p.onrender.com VERSION=1.0.0
```

This generates production-ready binaries in `bin/dist/`:
- `bin/dist/replay-linux-amd64`
- `bin/dist/replay-linux-arm64`
- `bin/dist/replay-darwin-amd64`
- `bin/dist/replay-darwin-arm64`
- `bin/dist/replay-windows-amd64.exe`

---

## Step 5: Publish CLI to GitHub Releases

1. Go to `https://github.com/Nathanim1919/replay/releases/new`.
2. Tag version: `v1.0.0`
3. Release title: `Replay v1.0.0 — Production MVP Release`
4. Attach the 5 binary files from `bin/dist/`.
5. Click **Publish release**.

---

## Step 6: Create One-Line Install Script for Users (`install.sh`)

Create a quick install script so users can install Replay in a single command.

```bash
curl -fsSL https://raw.githubusercontent.com/Nathanim1919/replay/trunk/install.sh | bash
```

---

## 🚀 How Users Use Your MVP (User Journey)

1. **User Installs CLI:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Nathanim1919/replay/trunk/install.sh | bash
   ```
2. **User Authenticates:**
   ```bash
   replay login
   ```
3. **User Records Session:**
   ```bash
   replay record demo.replay
   ```
4. **Instant Web Sharing:**
   The CLI automatically streams and provides an instant shareable link:
   `https://replay-space.vercel.app/replay/[id]`
