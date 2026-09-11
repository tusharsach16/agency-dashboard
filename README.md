# Agency Dashboard — Real-Time Client Project Dashboard

A production-grade, full-stack internal agency dashboard for managing client projects, tasks, team activities, live online presence, and automated notifications with strict role-based access control (RBAC) and real-time WebSocket broadcasting.

---

## 1. Project Overview

Agency Dashboard provides an end-to-end operational workspace for digital agencies. It enables leadership, project managers, and engineers to collaborate on client deliverables with real-time updates and zero polling.

### Roles & Responsibilities
- **Admin:** Full organization visibility. Manages team members, clients, all projects, global task statuses, and views the live active user presence count.
- **Project Manager (PM):** Manages client deliverables within their assigned projects. Creates and manages tasks, assigns developers, and monitors project activity feeds.
- **Developer:** Executes assigned deliverables. Views scoped projects, updates task statuses (`TODO` ➔ `IN_PROGRESS` ➔ `IN_REVIEW` ➔ `DONE`), and receives real-time task assignment alerts.

### Integrated System Workflow
Projects and clients form the core data layer. Tasks belong to projects and have assigned developers, priority ratings, and due dates. Any mutation (status update, assignment, creation) executes inside a PostgreSQL ACID transaction that simultaneously creates audit logs and notifications. Once committed, events are broadcast over WebSocket rooms to authorized users. Background cron jobs evaluate task deadlines independently to flag overdue deliverables.

---

## 2. Features

### A. Authentication & Role System
- **Dual-Token Authentication:** Ephemeral JWT access tokens (15m expiry) paired with persistent, database-backed refresh tokens (7d expiry).
- **Secure Cookie Transport:** Refresh tokens are delivered in `HttpOnly`, `SameSite=Lax` (or `SameSite=None; Secure` in production) cookies, completely inaccessible to JavaScript (`localStorage` is never used for refresh tokens).
- **Password Security:** Salted and hashed using `bcryptjs` (10 rounds).
- **API & Resource-Level Authorization:** Strict middleware hierarchy verifies JWT authenticity, role permissions (`Admin`, `PM`, `Developer`), and resource ownership (IDOR protection) on every endpoint.
- **Session Revocation:** Logout explicitly deletes refresh tokens from PostgreSQL and clears the client cookie.

### B. Project & Task Management
- **Hierarchical Scoping:** Clients ➔ Projects ➔ Tasks.
- **Ownership Boundaries:** PMs can only modify or assign tasks to projects where `managerId === req.user.id`. Developers can only access tasks assigned directly to them.
- **Deliverable Workflow:** Tasks support statuses (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) and priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Audit Logging:** Every state transition records the modifying user ID, timestamp, previous value, and new value in the `ActivityLog` table.
- **Overdue Detection:** Automated background job evaluates deadlines and updates `isOverdue: true` without requiring manual page reloads.

### C. Real-Time Activity Feed
- **WebSocket Transport:** Built on Socket.io for automatic reconnection, transport fallbacks, and authenticated room management.
- **Role-Filtered Isolation:**
  - **Admin:** Automatically subscribed to `feed:global` for organization-wide audit trails.
  - **PM:** Scoped to `feed:project:${projectId}` for managed projects.
  - **Developer:** Scoped strictly to projects containing tasks assigned to their user ID.
- **Offline Catch-Up:** Upon connection, clients retrieve the last 20 authorized events directly from PostgreSQL.
- **Zero Polling:** Broadcasts fire post-commit from server-side mutation pipelines.

### D. Role-Tailored Dashboard
- **Admin View:** System-wide metrics, total project/task distribution, overdue deliverables, and active online user count.
- **PM View:** Scoped to managed projects, team progress percentages, and overdue task counters.
- **Developer View:** Scoped to assigned tasks, completion ratios, and personal deadlines.
- **Server-Side Query Filtering:** Fully synchronized with browser URL query parameters (`?status=...&priority=...&projectId=...&assignedToId=...`).

### E. WebSocket-Based Online Presence
- **Live Active Users Count:** Dedicated metric card on Admin dashboard displaying real-time connected users (`<N> Online` with live pulsing indicator).
- **In-Memory Tracking:** Managed via `Map<string, Set<string>>` mapping authenticated user IDs to sets of active socket IDs.
- **Multi-Tab / Multi-Device Resilience:** Opening multiple tabs increments socket connections under the same user ID without inflating the unique user count. A user is only marked offline when their final socket disconnects.
- **Strict Admin Authorization:** Global presence count is broadcast exclusively to the `presence:admin` room. Developers and PMs cannot subscribe or receive presence payloads.
- **No Polling:** Real-time state synchronization over WebSocket connection lifecycle.

### F. Persistent Notification System
- **Transactional Triggers:** Created automatically when a task is assigned to a developer or transitioned to `IN_REVIEW` for PM review.
- **Real-Time Badge:** Live unread notification counter displayed in navigation bar.
- **Dropdown Controls:** View recent notifications, mark individual items as read, or mark all as read.
- **Database Persistence:** Unread states and notification history persist across logins and reloads.

### G. Public Landing Page
- **Pre-Authentication Product Showcase:** Clean, modern landing page featuring product value proposition, feature breakdown, role permissions matrix, interactive live preview mockup, and direct login/signup entry points.
- **Theme Support:** Dark/light mode theme toggling with smooth CSS variable transitions.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript, Vite) | SPA rendering, responsive state management, and type safety |
| **Styling & Design System** | Tailwind CSS v4 + Vanilla CSS Variables | Curated design tokens, glassmorphism, responsive grid, micro-animations |
| **Routing** | React Router DOM v6 | Client-side routing, protected routes, and role-based navigation guards |
| **Backend Framework** | Node.js + Express (TypeScript) | REST API endpoints, routing, middleware pipelines |
| **Real-Time Engine** | Socket.io (v4) | WebSocket management, room subscriptions, real-time presence, and event feeds |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM (v5) | Relational persistence, schema migrations, and type-safe query execution |
| **Validation** | Zod | Runtime request body, query parameter, and payload validation |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | Access/refresh token generation, verification, and password hashing |
| **Background Jobs** | `node-cron` | Periodic automated evaluation of overdue task deadlines |
| **CI/CD** | GitHub Actions | Automated PostgreSQL service testing, linting, typechecking, and build validation |
| **Containerization** | Docker + Docker Compose | Multi-stage production container builds and orchestrated local runtime |
| **Reverse Proxy** | Nginx Alpine | Static frontend file serving and proxy routing for API/WebSocket traffic |

---

## 4. Architecture

### Backend Layered Architecture
```
HTTP / WebSocket Request
        │
        ▼
   Routes Layer (`/src/routes/*`)
        │
        ▼
Validation & Middleware (`/src/middleware/*`, Zod schemas)
        │ (authMiddleware, roleGuard, request validation)
        ▼
 Controllers Layer (`/src/controllers/*`)
        │
        ▼
  Services Layer (`/src/services/*`)
        │ (business logic, transaction orchestration)
        ▼
  Prisma Client & PostgreSQL (`/src/config/prisma.ts`)
        │
        ▼
 Post-Commit Real-Time Broadcasts (`/src/sockets/*`)
```

### Frontend Architecture
```
Pages (`/src/pages/*`)
        │
        ▼
Components (`/src/components/*`)
        │
        ▼
Custom Hooks (`/src/hooks/*`)
        │ (useActivityFeed, useNotifications, useDashboardFilters)
        ▼
Context Providers (`/src/context/*` - AuthContext, ThemeContext)
        │
        ▼
API & Socket Services (`/src/services/api.ts`, `/src/services/socket.ts`)
```

The application strictly enforces Single Responsibility Principle (SRP):
- **Schemas:** Declare Zod validation rules and TypeScript interfaces.
- **Routes:** Map HTTP paths to controller actions and attach middleware.
- **Controllers:** Handle HTTP transport, status codes, and error formatting.
- **Services:** Execute database queries, transaction rollbacks, and business validation.
- **Sockets:** Manage transport connections, room access control, and event dispatch.

---

## 5. Role Permission Matrix

| Capability | Admin | Project Manager | Developer | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **View Global Dashboard** | Yes | No (Scoped) | No (Scoped) | `dashboard.service.ts` query constraints |
| **View Live Online Presence Count** | Yes | No | No | `presence:admin` socket room isolation |
| **Create / Delete Projects** | Yes | Managed Only | No | `assertProjectAccess` IDOR validation |
| **Create / Delete Tasks** | Yes | Managed Only | No | `task.service.ts` role guards |
| **Update Task Status** | Yes | Yes | Assigned Only | `assertTaskUpdateAccess` check |
| **View Activity Logs** | Global | Managed Projects | Assigned Tasks | `getAuthorizedActivities` filter |
| **Manage Clients** | Yes | Create/View Only | No | `client.routes.ts` role middleware |
| **Receive Assignment Alerts** | Yes | Yes | Assigned Tasks | `user:${userId}` socket room routing |

---

## 6. Real-Time Architecture

```
                 Authenticated Client
                          │
                          ▼
            Socket Authentication Middleware
           (Validates JWT token from handshake)
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   User Room                        Role & Project Rooms
(`user:${userId}`)            ┌────────────────────┬────────────────────┐
         │                    ▼                    ▼                    ▼
         │             Admin Global Room     PM Project Room     Dev Project Rooms
         │             (`feed:global`,       (`feed:project:*`)  (`feed:project:*`)
         │             `presence:admin`)
         ▼                    │                    │                    │
Personal Alerts &             └────────────────────┼────────────────────┘
Unread Counts                                      ▼
                                       Real-Time Activity Feeds &
                                          Live Presence Updates
```

- **Connection Lifecycle:** Handshake requires `auth.token`. Sockets without valid signatures are rejected before connection.
- **Room Isolation:** Sockets automatically join assigned rooms upon connection based on verified token identity.
- **Presence Channel:** Only admin sockets join `presence:admin`. Presence events (`presence:count`) are broadcast exclusively to this room.
- **Cleanup:** Disconnection automatically cleans up active socket sets in `presenceService` and leaves all subscribed rooms.

---

## 7. Transaction & Consistency Design

All state modifications involving multiple side-effects execute inside Prisma interactive transactions (`prisma.$transaction`):

```
Task Update Request (e.g. status change)
               │
               ▼
┌──────────────────────────────────────────────┐
│        Prisma Database Transaction           │
│                                              │
│  1. Update Task status in PostgreSQL         │
│  2. Insert ActivityLog record                │
│  3. Create Notification record (if assigned) │
└──────────────────────────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
[Transaction Rollback] [Transaction Commit]
      │                 │
      ▼                 ▼
 Return Error      1. Broadcast `feed:new` to project room
(No socket events  2. Emit `notification:new` to user room
 are emitted)      3. Emit updated `notification:unread_count`
```

### Why Post-Commit Broadcasting Matters
Emitting WebSocket events before transaction resolution causes ghost updates if a database constraint fails or rollback occurs. By design, socket events fire strictly *after* successful database commit.

---

## 8. Security

- **No Token Exposure:** Refresh tokens are never returned in JSON bodies and never stored in `localStorage`. They reside exclusively in `HttpOnly`, `SameSite` cookies.
- **Server-Side Identity:** Controllers derive user identity strictly from verified JWT payloads (`req.user.sub`), ignoring client-supplied user parameters in request bodies.
- **IDOR Protection:** Access to projects, tasks, and activity feeds is verified against database ownership records before reading or mutating resources.
- **Input Sanitization:** All incoming request bodies and query parameters pass through strict Zod schemas.
- **CORS Configuration:** Production origins are locked to verified client domains (`CLIENT_ORIGIN`) with `credentials: true`.

---

## 9. Database Design

```mermaid
erDiagram
    User ||--o{ RefreshToken : "has"
    User ||--o{ Project : "manages (PM)"
    User ||--o{ Task : "assigned to"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Notification : "receives"
    
    Client ||--o{ Project : "owns"
    Project ||--o{ Task : "contains"
    Project ||--o{ ActivityLog : "scoped to"
    
    Task ||--o{ ActivityLog : "generates"
    Task ||--o{ Notification : "triggers"
```

### Core Models
- **`User`**: Stores identity, email, hashed credentials, and role (`ADMIN`, `PM`, `DEVELOPER`).
- **`RefreshToken`**: Tracks active session tokens with expiration timestamps and cascade deletion.
- **`Client`**: Represents external client entities.
- **`Project`**: Links clients to managing PMs and contains tasks.
- **`Task`**: Deliverables with status, priority, due date, overdue flag, and developer assignment.
- **`ActivityLog`**: Immutable audit logs of task mutations.
- **`Notification`**: User-scoped alert items with read/unread flags.

---

## 10. Indexing Decisions

| Index | Target Table | Query Optimized | Reason |
| :--- | :--- | :--- | :--- |
| `@@index([role])` | `User` | Role-based lookups and user management | Speeds up developer/PM filtering |
| `@@index([userId])` | `RefreshToken` | Token rotation and logout invalidation | Fast session lookup on refresh |
| `@@index([managerId])` | `Project` | PM dashboard & project authorization | Instant retrieval of managed projects |
| `@@index([clientId])` | `Project` | Client deliverable aggregations | Optimizes client-scoped project lists |
| `@@index([projectId])` | `Task` | Project task board & activity retrieval | High-frequency query in dashboard |
| `@@index([assignedToId])`| `Task` | Developer dashboard & task assignment | Instant lookup of developer workload |
| `@@index([status])` | `Task` | Dashboard metrics & status filtering | Fast aggregation of status counts |
| `@@index([dueDate])` | `Task` | Overdue cron job & deadline sorting | Fast range scan for overdue tasks |
| `@@index([projectId, createdAt])` | `ActivityLog` | Project activity feed & catch-up query | Fast pagination of recent project events |
| `@@index([userId, isRead])` | `Notification` | Unread badge counts | Optimizes unread count computation |

---

## 11. API Overview

All routes are prefixed with `/api`.

### `/api/auth`
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Authenticate credentials, set HttpOnly refresh cookie, return access token.
- `POST /api/auth/refresh` — Issue new access token using verified refresh cookie.
- `POST /api/auth/logout` — Invalidate refresh token and clear cookie.
- `GET /api/auth/me` — Return current authenticated user profile.

### `/api/projects`
- `GET /api/projects` — List authorized projects (Role-scoped).
- `POST /api/projects` — Create project (Admin, PM).
- `GET /api/projects/:id` — Retrieve project details with tasks and client info.
- `PUT /api/projects/:id` — Update project details (Admin, managing PM).
- `DELETE /api/projects/:id` — Delete project (Admin, managing PM).

### `/api/tasks`
- `GET /api/tasks` — List authorized tasks with filtering support.
- `POST /api/tasks` — Create task within project (Admin, PM).
- `GET /api/tasks/:id` — Get task details and activity log history.
- `PUT /api/tasks/:id` — Full task update (Admin, PM).
- `PATCH /api/tasks/:id/status` — Update task status (Admin, PM, assigned Developer).
- `DELETE /api/tasks/:id` — Remove task (Admin, PM).

### `/api/dashboard`
- `GET /api/dashboard` — Fetch role-scoped statistics, status breakdown, overdue totals, and task lists. Supports query filters (`?status=...&priority=...&projectId=...&assignedToId=...`).

### `/api/activity`
- `GET /api/activity` — Retrieve authorized activity log events (optional `?projectId=...`).

### `/api/notifications`
- `GET /api/notifications` — Fetch user notifications and current unread count.
- `PATCH /api/notifications/:id/read` — Mark single notification as read.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.

### `/api/users` & `/api/clients`
- `GET /api/users/developers` — List developer team members for assignment.
- `GET /api/clients` — List clients (Admin, PM).
- `POST /api/clients` — Create client (Admin, PM).

---

## 12. WebSocket Events

| Event Name | Direction | Trigger | Recipients | Payload |
| :--- | :--- | :--- | :--- | :--- |
| `presence:count` | Server ➔ Client | User connects / disconnects | `presence:admin` room | `{ onlineCount: number }` |
| `feed:new` | Server ➔ Client | Task mutation committed | `feed:global` or `feed:project:${id}` | `ActivityEvent` object |
| `feed:catchup` | Client ➔ Server | Client connects to activity feed | Handled by server | `{ projectId?: string }` |
| `feed:catchup:result` | Server ➔ Client | Catch-up query resolved | Requesting socket | `ActivityEvent[]` (max 20) |
| `feed:subscribe:project` | Client ➔ Server | User selects project filter | Handled by server | `{ projectId: string }` |
| `feed:unsubscribe:project`| Client ➔ Server | User leaves project filter | Handled by server | `{ projectId: string }` |
| `notification:new` | Server ➔ Client | Task assigned / review requested | `user:${userId}` room | `NotificationItem` object |
| `notification:unread_count`| Server ➔ Client | Notification state changes | `user:${userId}` room | `{ count: number }` |

---

## 13. Background Job

- **Engine:** `node-cron`
- **File:** `backend/src/jobs/overdueTasks.job.ts`
- **Schedule:** `*/15 * * * *` (Runs every 15 minutes)
- **Logic:** Queries PostgreSQL for tasks where `dueDate < new Date()`, `isOverdue === false`, and `status !== 'DONE'`. Atomically updates matching records to `isOverdue: true`.
- **Decoupling:** Evaluates deadlines on the server independently of client connections or page visits.

---

## 14. Testing

The backend includes automated integration tests running with `tsx`:

```bash
cd backend
npm test
```

### Verified Test Suites (6 Test Suites)
1. **`auth.test.ts`**: 20 comprehensive tests covering registration, login, JWT validation, refresh token rotation, password hashing, and role checks.
2. **`project-task.test.ts`**: Tests project/task creation, PM ownership boundaries, developer assignment, and IDOR prevention.
3. **`realtime-feed.test.ts`**: Tests Socket.io authentication, room isolation, catch-up history, and cross-role privacy.
4. **`dashboard.test.ts`**: Tests role-based dashboard aggregations and query parameter filtering.
5. **`notification.test.ts`**: Tests transactional notification triggers, unread counters, and mark-as-read endpoints.
6. **`presence.test.ts`**: Tests WebSocket presence count, multi-tab deduplication, disconnect handling, and Admin RBAC isolation.

---

## 15. CI/CD

GitHub Actions pipelines are configured in `.github/workflows/`:

- **Continuous Integration (`ci.yml`):**
  - Triggers on all pull requests and pushes to `main`.
  - Spins up a real PostgreSQL 16 service container in the CI runner.
  - Runs Prisma migrations (`npx prisma migrate deploy`) and database seeds.
  - Executes full backend test suite (`npm test`).
  - Executes TypeScript typechecks for backend and frontend.
  - Builds the production frontend Vite bundle.
- **Frontend Deployment (`deploy-frontend.yml`):**
  - Triggers on merge to `main` after CI passes. Deploys static build to Vercel.
- **Backend Deployment (`deploy-backend.yml`):**
  - Runs database migrations against production PostgreSQL and triggers backend deployment on Render (supporting persistent WebSockets).

---

## 16. Docker Configuration

Multi-stage production Docker configurations are provided for zero-dependency containerized execution.

### Services Orchestrated (`docker-compose.yml`)
- **`postgres`:** PostgreSQL 16 Alpine container with health check probe.
- **`backend`:** Node 20 Alpine runner with musl OpenSSL compatibility and automated Prisma migrations.
- **`frontend`:** Multi-stage build deployed to Nginx Alpine reverse proxy.

### Docker Commands

```powershell
# Build and start all services in detached mode
docker compose up -d --build

# View real-time container logs
docker compose logs -f

# Run database seed inside running backend container
docker compose exec backend npm run seed

# Stop all containers
docker compose down
```

---

## 17. Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- npm 10+

### Setup Steps

1. **Clone repository:**
   ```bash
   git clone https://github.com/tusharsach16/agency-dashboard.git
   cd agency-dashboard
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure DATABASE_URL, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET in .env
   
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access Applications:**
   - Frontend: `http://localhost:5173` (or `http://localhost:3000` via Docker)
   - Backend API: `http://localhost:4000`

---

## 18. Environment Variables

### Backend (`backend/.env`)
```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/agency_dashboard?schema=public"
JWT_ACCESS_SECRET="your-32-char-jwt-access-secret-key"
JWT_REFRESH_SECRET="your-32-char-jwt-refresh-secret-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

### Frontend (`frontend/.env.example`)
```env
# Optional in dev (defaults to Vite proxy /api and /)
VITE_API_URL=/api
VITE_SOCKET_URL=/
```

---

## 19. Seed Data

The database seed (`backend/prisma/seed.ts`) generates:
- **1 Admin:** `admin@agency.dev` (Password: `password123`)
- **2 Project Managers:** `pm1@agency.dev`, `pm2@agency.dev`
- **4 Developers:** `dev1@agency.dev`, `dev2@agency.dev`, `dev3@agency.dev`, `dev4@agency.dev`
- **3 Clients:** `Northwind Retail`, `Blue Harbor Logistics`, `Solstice Media`
- **3 Projects:** `Website Revamp`, `Inventory App`, `Marketing Portal`
- **18 Tasks:** 6 per project across all statuses and priorities.
- **2 Overdue Tasks:** Pre-configured with past due dates to verify overdue handling.
- **Activity Logs & Notifications:** Seeded across tasks to verify initial feeds.

---

## 20. Engineering Challenges & Solutions

1. **Transactional Integrity for Real-Time Feeds:**
   - *Problem:* Emitting socket events during task updates could broadcast invalid data if database writes failed.
   - *Solution:* Executed task updates, activity log writes, and notifications in a single Prisma interactive transaction. Socket broadcasts fire strictly *after* successful commit.
2. **Multi-Tab Presence Deduplication:**
   - *Problem:* A simple integer counter increments when a user opens multiple tabs and decrements prematurely when closing one tab.
   - *Solution:* Implemented `Map<userId, Set<socketId>>`. Presence count represents `Map.size`, keeping users online until their last active socket disconnects.
3. **Role-Filtered Socket Feeds without Leaking Data:**
   - *Problem:* Broadcasting task updates globally allows unauthorized users to inspect activities of foreign projects.
   - *Solution:* Sockets join scoped rooms (`feed:project:${id}`). Task mutations publish only to the respective project room and `feed:global` for Admins.
4. **Cross-Domain Cookie Security in Production:**
   - *Problem:* Modern browsers block cross-origin cookies between Vercel and Render when using default cookie options.
   - *Solution:* Configured dynamic `SameSite=None; Secure` cookies in production mode while keeping `SameSite=Lax` for local development.

---

## 21. Architectural Decisions

- **Socket.io over Raw WebSocket:** Chosen for built-in room abstractions, automatic reconnection logic, and transport fallback mechanisms.
- **PostgreSQL & Prisma:** Relational modeling ensures foreign key integrity and cascade deletions, while Prisma provides type-safe migrations and transactions.
- **HttpOnly Cookies for Refresh Tokens:** Prevents token exfiltration via Cross-Site Scripting (XSS).
- **In-Memory Presence Tracking:** Optimal and zero-latency for single-instance backends. A shared Redis adapter can be plugged in when horizontally scaling across multiple nodes.
- **Server-Side RBAC Enforcement:** UI route guards are treated purely as a user convenience; all authorization checks execute on the backend before data access.

---

## 22. Known Limitations

- **Single-Instance Presence State:** In-memory presence tracking (`Map<userId, Set<socketId>>`) operates within a single Node.js process. Horizontally scaling across multiple backend instances would require a shared Redis adapter with Redis sets or pub/sub.
- **Render Deployment Webhook:** The backend deployment workflow uses a fire-and-forget deploy hook (`curl -X POST`), requiring the Render dashboard to monitor live build logs.

---

## 23. Project Structure

```
agency-dashboard/
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── tests/
│   │   └── server.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

---

## 24. Assignment Requirement Checklist

### Authentication & Role System
- [x] Admin / PM / Developer roles implemented
- [x] JWT access token + refresh token workflow
- [x] HttpOnly cookie storage for refresh tokens
- [x] API-level RBAC middleware
- [x] Resource-level authorization & IDOR protection

### Project & Task Management
- [x] Projects and client management
- [x] Task CRUD with status and priority workflow
- [x] Persistent audit logs for state transitions
- [x] PM ownership boundaries enforced
- [x] Automated background overdue task evaluation

### Real-Time Activity Feed
- [x] Socket.io WebSocket architecture
- [x] Role-filtered activity feeds
- [x] Admin global activity room
- [x] PM project-scoped feeds
- [x] Developer assigned-task feeds
- [x] Last 20 offline events catch-up from PostgreSQL
- [x] Zero polling implementation

### Dashboard & Analytics
- [x] Admin organization-wide metrics
- [x] PM project metrics
- [x] Developer workload metrics
- [x] Status, priority, project, and assignee filters
- [x] URL query parameter synchronization
- [x] Live active-user presence counter for Admin

### Notifications
- [x] Task assignment notifications
- [x] Status change (`IN_REVIEW`) alerts
- [x] Database persistence & read state tracking
- [x] Mark individual and mark all read endpoints
- [x] Real-time unread counter via WebSockets

### DevOps & Engineering
- [x] React 18 + TypeScript + Vite frontend
- [x] Node.js + Express + TypeScript backend
- [x] PostgreSQL 16 with Prisma ORM
- [x] Server-side Zod validation
- [x] Automated test suite (6 suites)
- [x] GitHub Actions CI pipeline with Postgres service
- [x] Docker & Docker Compose containerization

---

## 25. Submission Explanation

The most challenging engineering problem in this project was guaranteeing data consistency between PostgreSQL transactions and real-time WebSocket broadcasts while preventing IDOR vulnerabilities across role boundaries. Ensuring that task status transitions, audit logs, and developer notifications executed atomically required Prisma interactive transactions, with socket events dispatched strictly post-commit to prevent ghost notifications on transaction rollbacks.

The real-time role-filtered activity feed was implemented by combining Socket.io handshake JWT authentication with server-managed room subscriptions (`feed:global` for Admins and `feed:project:${id}` for PMs and Developers). When a deliverable changes state, the backend evaluates the project context and emits the event exclusively to authorized project rooms. Sockets also support offline catch-up by retrieving the last 20 database records upon connection.

If I were to build this differently in a future iteration, I would implement an external pub/sub cache layer using Redis and the `@socket.io/redis-adapter`. While the current in-memory presence and room management is zero-latency and optimal for single-instance deployments, a Redis adapter would enable seamless horizontal scaling across multiple container instances with distributed state synchronization.
