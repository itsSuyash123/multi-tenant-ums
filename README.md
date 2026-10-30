# Multi-Tenant User Management System

Node.js + Express 5 + MongoDB (Mongoose) + Redis backend where a **Superadmin** creates **Masters** (tenants), each master gets its **own isolated MongoDB database**, and two completely separate user systems exist:

- **Public users**: sign up / log in themselves
- **Master users**: created by a master, stored inside that master's database

Cross-login between the two systems is not possible.

---

## Tech stack
Express 5 · Mongoose 8 · ioredis · JWT · bcryptjs · Joi · helmet · cors · morgan

## Setup (Windows)

### 1. Prerequisites
- **Node.js 18+** (LTS) - https://nodejs.org
- **MongoDB Community Server** running on `mongodb://127.0.0.1:27017` (installs as a Windows service), optionally MongoDB Compass to inspect databases
- **Redis** on `127.0.0.1:6379`. Pick one:
  - Docker Desktop: `docker run -d --name redis -p 6379:6379 redis`
  - Memurai (Redis-compatible Windows service)
  - WSL: `sudo apt install redis-server && sudo service redis-server start`

> Redis is optional at runtime: if it is down the API keeps working without cache.

### 2. Install and run
```powershell
git clone <repo-url>
cd multi-tenant-ums
npm install
copy .env.example .env      # edit values if needed
npm run seed                # creates the superadmin from .env
npm run dev                 # http://localhost:5000
```

Default superadmin (from `.env`): `admin@test.com` / `Admin@123`

---

## Architecture

```
src/
  config/        db.js (Mongo connection + per-tenant useDb), redis.js
  models/        schemas.js (all schemas), index.js (connection-aware model factory)
  middlewares/   auth.js (JWT + role check), tenant.js (resolve tenant DB), validate.js, error.js
  validators/    Joi schemas
  controllers/   superadmin, master, masterUser, publicAuth, data
  routes/        superadmin, master, auth, data
  utils/         AppError, jwt, cache
  scripts/       seedSuperadmin.js
  app.js, server.js
```

### Database design

| Database | Collections | Purpose |
|---|---|---|
| `mts_main` | `superadmins`, `masters` | Platform data: superadmin + master registry |
| `mts_public` | `users`, `datas` | Public signup users and their data |
| `tenant_<code>` (one per master) | `users`, `datas` | Users created by that master and their data |

**Schemas**

- `SuperAdmin`: `email` (unique), `password` (hashed, `select:false`)
- `Master`: `name`, `email` (unique), `password`, `code` (unique tenant slug), `dbName` (`tenant_<code>`, unique), `isActive`, `createdBy`
- `User`: `name`, `email` (unique **within its DB**), `password`, `createdBy` (master id for tenant users), `isActive`
- `Data`: `title`, `description`, `owner` (indexed), timestamps

When a master is created, its database `tenant_<code>` is provisioned immediately (collections + indexes).

### How tenant isolation works
1. One Mongoose connection pool; tenant DBs are accessed with `connection.useDb(dbName, { useCache: true })`.
2. Models are registered **per connection** (`models/index.js`), so `User(tenantDb)` and `User(publicDb)` are different collections in different databases.
3. The tenant DB is resolved **only from the signed JWT** (`middlewares/tenant.js`), never from the request body, query or headers, so a user cannot point a request at another tenant.
4. Every `/data` query is also scoped by `owner = req.user.id`.
5. If a master is deactivated (`isActive: false`), its master and users are blocked.

### How cross-login is prevented
- `POST /auth/login` searches **only** `mts_public.users`.
- `POST /master/user/login` searches **only** `tenant_<masterCode>.users` (requires `masterCode`).
- Each JWT carries a `role` (`superadmin`, `master`, `master_user`, `public_user`) and, for tenant roles, the `dbName`. Every protected route whitelists roles; any other token gets **403**.

### Redis caching
The spec mentions "menu listing"; this was interpreted as the **listing endpoints**:

| Endpoint | Cache key | Invalidated on |
|---|---|---|
| `GET /superadmin/masters` | `main:masters:list` | master created |
| `GET /master/users` | `<dbName>:users:list` | user created in that tenant |
| `GET /data` | `<dbName>:data:<userId>` | create / update / delete |

Keys are namespaced by tenant DB, so tenants never share cache. Responses include `"source": "cache" | "db"`. TTL is set by `CACHE_TTL` (default 300s).

---

## API reference

Protected routes need `Authorization: Bearer <token>`.

### Superadmin
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/superadmin/login` | - | `{ email, password }` |
| POST | `/superadmin/master` | superadmin | `{ name, email, password, code }` |
| GET | `/superadmin/masters` | superadmin | - |

### Master
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/master/login` | - | `{ email, password }` |
| POST | `/master/user` | master | `{ name, email, password }` |
| GET | `/master/users` | master | - |

### Public users
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/auth/signup` | - | `{ name, email, password }` |
| POST | `/auth/login` | - | `{ email, password }` |
| GET | `/auth/profile` | public_user | - |

### Master users
| Method | Endpoint | Auth | Body |
|---|---|---|---|
| POST | `/master/user/login` | - | `{ email, password, masterCode }` |
| GET | `/master/user/profile` | master_user | - |

### Common CRUD (tenant-specific)
Allowed for `public_user`, `master_user` and `master`. Data goes to `mts_public` for public users and to `tenant_<code>` for masters and master users.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/data` | `{ title, description? }` |
| GET | `/data` | - |
| GET | `/data/:id` | - |
| PUT | `/data/:id` | `{ title?, description? }` (at least one) |
| DELETE | `/data/:id` | - |

### Response format
```json
{ "success": true, "data": {} }
{ "success": false, "message": "Invalid credentials" }
```
Status codes: `401` bad/missing token or credentials, `403` wrong system/role or inactive tenant, `404` not found, `409` duplicate, `422` validation error.

---

## Quick test flow
A Postman collection is included: `postman_collection.json` (tokens are saved automatically into collection variables).

1. Superadmin login, create masters `acme` and `beta`, list masters twice (second call is served from cache).
2. Master (acme) login, create a user, list users.
3. Master user login with `masterCode: "acme"`, view profile.
4. Public signup, login, profile.
5. Cross-login checks: public token on `/master/user/profile` returns 403; master-user token on `/auth/profile` returns 403; master-user credentials on `/auth/login` return 401.
6. `/data` CRUD with each token; check in Compass that records land in `tenant_acme` vs `mts_public`.

## Assumptions
- "Menu listing" in the brief is treated as the listing endpoints (see Redis caching).
- Master users identify their tenant at login with `masterCode`.
- Data records are private to the user who created them, within their tenant DB.
