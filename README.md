# مرکز تجارت متمرکز هوشمند ایرانیان (Vaahedi)

پلتفرم B2B تجارت خارجی برای صادرکنندگان، واردکنندگان و تولیدکنندگان ایرانی

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, Vite 6, TanStack Router, TanStack Query v5, Zustand, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js 22 LTS, Fastify 5, tRPC v11, Prisma 6 |
| Database | PostgreSQL 17, Redis 7 |
| Storage | MinIO (S3-compatible) |
| Queue | BullMQ |
| AI Chat | avalai.ir (OpenAI-compatible) + Google Gemini |
| Infrastructure | Docker Compose, Nginx, GitHub Actions |

## Architecture

Clean Architecture with 5 layers:

```
Domain → Application → Infrastructure → Interface (tRPC) → Presentation (React)
```

## Project Structure

```
vaahedi/
├── apps/
│   ├── server/          # Node.js + Fastify + tRPC API
│   └── web/             # React + Vite SPA
├── packages/
│   ├── shared/          # Zod schemas, enums, shared utilities
│   └── db/              # Prisma schema + client
├── docker/
│   ├── nginx/           # Nginx configuration
│   └── postgres/        # Database initialization
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .github/workflows/   # GitHub Actions CI/CD
```

---

## Getting Started

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/vaahedi.git
cd vaahedi
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in required values:

```env
# Required — change these:
POSTGRES_PASSWORD=your_strong_password
JWT_SECRET=your_64_char_random_secret
JWT_REFRESH_SECRET=another_64_char_random_secret
MINIO_ROOT_PASSWORD=your_minio_password

# Optional — for AI chat:
AVALAI_API_KEY=your_avalai_key
```

### 3. Start Dev Infrastructure (Docker)

```bash
npm run docker:dev
# Starts: PostgreSQL :5432, Redis :6379, MinIO :9000/:9001
```

Wait ~10 seconds for services to be healthy, then verify:

```bash
docker compose -f docker-compose.dev.yml ps
```

### 4. Database Setup

```bash
cd packages/db
npm run db:migrate    # Run migrations (creates all tables)
npm run db:seed       # Seed admin user + sample data
```

The seed creates a super admin:
- Mobile: `09000000000`
- Password: `Admin@123456` (change immediately)
- User Code: `0000001`

### 5. Start Development Servers

From the project root:

```bash
npm run dev
```

This starts (via Turborepo):
- API server: http://localhost:4000
- Web app: http://localhost:3000

**Health check:** http://localhost:4000/health

---

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | TypeScript typecheck all packages |
| `npm run docker:dev` | Start dev infrastructure |
| `npm run docker:prod` | Start production stack |

### Database Scripts (from `packages/db`):

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply migrations (dev) |
| `npm run db:migrate:prod` | Apply migrations (production) |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:reset` | Reset database (⚠️ deletes all data) |

---

## MinIO Console

Access MinIO admin UI at http://localhost:9001
- Username: `minioadmin`
- Password: value of `MINIO_ROOT_PASSWORD` in `.env`

---

## Production Deployment

### Prerequisites

- Linux server with Docker Compose v2+
- Domain name with DNS pointing to server
- SSL certificate (or use Let's Encrypt)

### Steps

1. Clone repository on server:
   ```bash
   git clone https://github.com/your-org/vaahedi.git /opt/vaahedi
   cd /opt/vaahedi
   ```

2. Create `.env` from template and fill **all** values including:
   - `DOMAIN=yourdomain.com`
   - All secrets with strong random values

3. Place SSL certificates:
   ```
   docker/nginx/certs/fullchain.pem
   docker/nginx/certs/privkey.pem
   ```

4. Start production stack:
   ```bash
   npm run docker:prod
   ```

5. Run database migrations:
   ```bash
   docker compose -f docker-compose.prod.yml exec api \
     node -e "require('./packages/db/src').prisma.\$connect()"
   ```

### GitHub Actions Auto-Deploy

Set these secrets in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Production server IP / hostname |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private SSH key |

On every push to `main`, the pipeline will:
1. Type check & lint
2. Build all packages
3. Build & push Docker images to GitHub Container Registry
4. SSH into server and deploy

---

## API Overview (tRPC)

All procedures accessible at `/trpc/*`

| Router | Procedures |
|--------|-----------|
| `auth` | register, login, logout, me, sendOtp, verifyOtp |
| `product` | list, getById, myProducts, create, update, delete, approve |
| `trade` | createRequest, myRequests, adminList, matchRequests, requestAnalysis |
| `chat` | newConversation, listConversations, getMessages, sendMessage, deleteConversation |

---

## Environment Variables Reference

See [`.env.example`](.env.example) for the full list with descriptions.

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit with conventional commits: `feat:`, `fix:`, `chore:`, etc.
3. Open a Pull Request to `develop`

---

## License

Private — All rights reserved © Vaahedi
