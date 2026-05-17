# Habit Tracker SaaS

Mobile-first habit card platform with two-finger verification, i18n SEO, and PostgreSQL.

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

## Environment

Copy the example file and update secrets (no quotes around values for Docker env-file):

```bash
cp .env.example .env
```

## PostgreSQL (no docker-compose)

```bash
docker build -t habit-tracker-postgres -f docker/postgres.Dockerfile .
docker run --name habit-tracker-db -p 5432:5432 -d habit-tracker-postgres
```

## Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Development

```bash
npm run dev
```

Open http://localhost:3000/zh-TW

## Production Docker Image

```bash
docker build -t habit-tracker-app .
docker run --name habit-tracker-app -p 3000:3000 --env-file .env habit-tracker-app
```
