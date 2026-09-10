# Agency Client Project Dashboard

Real-time client project management dashboard with role-based access control
(Admin / Project Manager / Developer) and a live, role-filtered activity feed.

## Stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Real-time:** Socket.io
- **Background jobs:** node-cron
- **Auth:** JWT access token (memory/header) + refresh token (HttpOnly cookie)

## Why these choices

- **Express over Fastify:** team familiarity + wide middleware ecosystem for
  quick role-guard composition. Fastify's schema validation is nice but not
  worth the ramp-up cost here.
- **Socket.io over raw WebSocket:** built-in room support (used for per-project
  and per-role scoping), automatic reconnection, and fallback transport — all
  needed for the "missed events on reconnect" requirement without hand-rolling
  a reconnection protocol.
- **node-cron over Bull:** the overdue-task sweep is a single lightweight
  periodic query, not a job queue with retries/backpressure needs. Bull would
  add a Redis dependency for no real benefit at this scale.
- **Refresh token in HttpOnly cookie:** prevents access via JS/XSS; access
  token kept short-lived in memory on the client.

## Project structure

```
agency-dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── middleware/       # auth + role guards
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── jobs/             # overdue-task cron
│       ├── sockets/          # socket.io namespaces + room logic
│       ├── types/
│       └── server.ts
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── context/
        └── services/
```

## Local setup

```bash
docker compose up -d          # postgres
cd backend && npm install
cp .env.example .env          # fill in secrets
npx prisma migrate dev
npx prisma db seed
npm run dev

cd ../frontend && npm install
npm run dev
```

## Database schema (summary)

- `User` — role enum (ADMIN, PM, DEVELOPER)
- `Client`
- `Project` — belongs to a `managerId` (PM) and a `Client`
- `Task` — belongs to `Project`, assigned to a `User` (developer), has status/priority/dueDate
- `ActivityLog` — immutable append-only log of task changes (taskId, userId, field, fromValue, toValue, createdAt)
- `Notification` — userId, message, isRead, createdAt

Indexes: `Task.projectId`, `Task.assignedToId`, `Task.status`, `Task.dueDate`,
`ActivityLog.projectId`, `ActivityLog.createdAt` — these back every filter/feed
query described in the spec.

