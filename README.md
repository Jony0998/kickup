# KickUp - Backend (NestJS monorepo)

Backend for **[KickUp](https://kickup.my)**, a live real-time sports platform where players find, create and join football matches, teams and tournaments.

**Live:** https://kickup.my | **Frontend repo:** [kickup-next](https://github.com/Jony0998/kickup-next)

## Tech stack

- **NestJS** (TypeScript) monorepo
- **GraphQL** API
- **MongoDB** (Mongoose)
- **WebSocket** for real-time updates
- **Docker** and docker-compose, deployed on a Linux VPS

## Structure

```
apps/
  kickup-api/     # main GraphQL API + WebSocket gateway
  kickup-batch/   # background / scheduled jobs
```

## Features

- Auth and user profiles (members and admins)
- Matches, teams and tournaments: create, join, leave
- Real-time updates pushed to clients over WebSocket
- Image uploads
- Admin tools (see `ADMIN_SIGNUP.md`)

## Run locally

```bash
cp .env.example .env   # fill in MongoDB URI and secrets
npm install
npm run start:dev
```

## Run with Docker

```bash
docker compose up -d --build
```

## Author

**Janobiddin Bozorov (Jony)** - Full-Stack Developer
[GitHub](https://github.com/Jony0998) | [LinkedIn](https://www.linkedin.com/in/janobiddin-bozorov-a03429412)
