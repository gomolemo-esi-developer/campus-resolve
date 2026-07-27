# Complaint Resolution System — Application Documentation

**A campus complaint management platform connecting students and staff through a unified, real-time resolution workflow.**

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [How It Works — Detailed Functionality](#2-how-it-works--detailed-functionality)
3. [Tech Stack & Services](#3-tech-stack--services)
4. [Key Technical Decisions & Implementation Details](#4-key-technical-decisions--implementation-details)
5. [How to Describe the App to Others](#5-how-to-describe-the-app-to-others)
6. [Appendix: Known Gaps & Technical Debt](#6-appendix-known-gaps--technical-debt)

---

## 1. Application Overview

### 1.1 What the app is

The **Complaint Resolution System** is a multi-tenant campus platform that digitizes the full lifecycle of a student complaint — from submission to routing, staff response, escalation, and resolution — for a university environment (built around Tshwane University of Technology's campus/faculty/department structure, e.g. Soshanguve North/South, Arcadia).

It is architected as a **monorepo of four cooperating single-page applications**, all served from one origin through a routing proxy, backed by a shared Express API layer, a Supabase/PostgreSQL data store, and a set of supporting AWS services (Cognito for identity, S3 for attachments, API Gateway WebSockets + DynamoDB + SQS + Lambda for real-time push).

```
                          ┌─────────────────────────┐
                          │   Proxy Server :3000     │
                          │  (single public origin)  │
                          └────────────┬─────────────┘
              ┌───────────────┬────────┼────────┬───────────────┐
              │               │        │        │               │
        Landing Page    Campus Voice  Campus Resolve   Campus Admin
           ( / )          (/voice/)     (/resolve/)      (/admin/)
        marketing site   student app    staff app       admin app
```

### 1.2 Main objectives

- Give **students** a single, simple channel to file and track complaints about academics, facilities, services, and campus life.
- Give **staff** a structured inbox that automatically routes the right complaint to the right person, with escalation when SLAs are missed.
- Give **administrators** full control over the institutional data model (campuses, faculties, departments, courses, modules, staff, students, roles) that everything else is routed against.
- Do all of this with **real-time synchronization** — a staff reply appears in the student's thread (and vice versa) without a page refresh — and a **single sign-on identity** shared across the student, staff, and admin apps.

### 1.3 Target users & problems solved

| User | Problem before this system | What the app gives them |
|---|---|---|
| **Students** | No consistent channel to raise issues (facilities, courses, timetables, harassment reports); no visibility into status once raised | A structured complaint form, categorized by type, with a persistent, trackable message thread and live status updates |
| **Support/academic staff** | Complaints arrive ad-hoc (email, in person, hearsay) with no ownership or SLA | An assigned inbox with automatic routing by category, priority, and role, escalation when overdue, and a shared "quick notes" workspace for case handling |
| **Administrators** | Institutional structure (who works where, what qualifies as which department) lives in spreadsheets, disconnected from any complaint workflow | A CRUD console over the entire institutional graph (campuses → faculties → departments → courses → modules; staff/students/roles/residences) that directly powers complaint routing |

### 1.4 High-level features & modules

- **Landing Page** — public marketing/entry site (About, Services, Blog, Work, Contact) and the shared entry point at `/`.
- **Campus Voice** (student portal) — complaint submission, threaded messaging, file attachments, profile management.
- **Campus Resolve** (staff portal) — complaint inbox with assignment/escalation, Quick Notes case-management tool, staff profile, and a placeholder "Ask-Tut" AI assistant surface.
- **Campus Admin** (institutional admin console) — CRUD management of campuses, faculties, departments, courses, modules, roles, staff, students, residences, and extracurriculars.
- **Shared identity layer** — one Cognito account authenticates a user across Voice, Resolve, and Admin, with role-scoped routing.
- **Cross-app real-time sync** — complaint creation, replies, and status/escalation changes propagate live between the student and staff apps via Supabase Realtime, with a redundant AWS WebSocket channel.

---

## 2. How It Works — Detailed Functionality

### 2.1 Core workflow: filing and resolving a complaint

```
 STUDENT (Campus Voice)                          STAFF (Campus Resolve)
 ───────────────────────                         ───────────────────────
 1. Signs in (Cognito)
 2. Opens "New Complaint"
 3. Picks a complaint type
    (e.g. "Course Complaint")
 4. Writes title + description,
    sets priority, attaches files
 5. Submits  ──────────────►  Complaint persisted in `complaints`
                               table (Supabase); routing engine
                               (resolveComplaintRouter.js) evaluates
                               category_routing rules and assigns
                               the complaint to an available staff
                               member, respecting per-staff open-case
                               caps and category→role mapping
                                                  │
                                                  ▼
                                     6. Complaint appears in staff
                                        member's Resolve inbox
                                        (assigned/unassigned view)
                                     7. Staff opens thread, reads
                                        student's message + files
                                     8. Staff replies
 9. Reply appears live in the    ◄──────────────  (Supabase Realtime
    student's thread via                           `postgres_changes`
    useComplaintSync (no                           push)
    refresh needed)
 10. Thread continues; if unresolved past its SLA window, the
     complaint auto-escalates to the next role level, with an
     escalation_history entry and a notification generated
 11. Staff marks complaint resolved/closed
```

### 2.2 Escalation & routing logic

Every complaint type (`complaint_types` table) carries an `sla_hours` value (default 48h), a `default_escalation_level`, and a `max_level`. When a complaint is created or re-evaluated:

1. `computeEscalationLevel()` compares elapsed time since filing against multiples of the SLA window (1×, 2×, up to `max_level`×) to determine the current urgency level.
2. `findRoutingRule()` looks up `category_routing` using a three-tier match: **type-specific rule → category-key rule → catch-all rule**.
3. `pickAvailableAssignee()` load-balances across eligible staff, capping each person's open-case count (default max 20).
4. The complaint's `assigned_to` and `current_level` are updated, and a `complaint_conversations` row links the complaint to its cross-app conversation thread.
5. If a complaint is manually or automatically escalated later, `escalateComplaint()` increments the level, re-routes if needed, writes an `escalation_history` audit row, and inserts a `notifications` row (with a deep link) for the new assignee.

Category-to-role mapping follows an institutional hierarchy, e.g.:
- **Facilities / Student Services / Accommodation / Finance / Registration / Security / Student Life** → Department Administrator → (Residence Manager for accommodation) → Head of Department.
- **Course Complaint / Timetable / Lecture Hall-Lab / Report Lecturer** → Lecturer → Department Administrator → (Timetable Manager) → Head of Department.

### 2.3 Authentication journey

```
User visits Voice/Resolve/Admin → LoginForm
   → authService-cognito.ts (shared package)
   → POST /api/auth/cognito/signin (proxy-server)
   → cognitoAuthController.js → AWS Cognito
   → JWT tokens returned (ID + Access, RS256; Refresh)
   → ID/Access tokens → localStorage
   → Refresh token → httpOnly Secure cookie
   → ProtectedRoute gates app routes by requiredRoles
   → 401 responses trigger silent token refresh
```

A single Cognito User Pool serves all three portal apps, so one account works across Campus Voice, Campus Resolve, and Campus Admin — but each app has its own signup field requirements and redirect target:

| App | Required signup fields | Sign-in accepts | Post-login redirect |
|---|---|---|---|
| Campus Admin | Email, password (name optional) | Email | `/campus` |
| Campus Resolve | Email, password, first/last name, staff number | Email or staff number | `/dashboard` |
| Campus Voice | Email, password, first/last name, student number | Email, student number, or staff number | `/messages` |

New signups are matched against admin-pre-loaded `students`/`staff` records by exact email + number (`preRegistrationService.js`); a match "claims" that row and seeds the canonical `profiles` record used everywhere else in the app.

### 2.4 Major components, pages, and features

#### Campus Voice (student portal)
| Page/Component | Purpose |
|---|---|
| `Splash`, `Login` | Entry and authentication |
| `Index` / `SubMenu` | Landing/navigation after login |
| `Complaint` | Complaint submission form — type dropdown, title (5–200 chars), description (20–5000 chars), priority selector, real S3 file attachments |
| `Messages` | List of the student's complaints with status/category/date filters and status badges |
| `MessageDetail` | Full thread view: staff replies (styled distinctly, with escalation-level badge), reply composer, live updates via `useComplaintSync` |
| `Profile` | Student profile and enrolled-module management |

#### Campus Resolve (staff portal)
| Page/Component | Purpose |
|---|---|
| `Complaints` | Assigned/unassigned complaint inbox with status changes and real-time updates |
| `QuickNotes` | Staff case-management notes with file and link attachments, search, and edit/view/delete flows |
| `Profile` | Staff profile — title, initials, role, department, faculty, campus, professional history entries |
| `Sidebar`, `InboxPanel`, `ComposeArea`, `MessageDetail` | Inbox layout and threaded reply composition |
| Ask-Tut surface | UI and API endpoints exist as a scaffold for a future AI assistant; **not functionally wired to any AI model today** |

#### Campus Admin (institutional console)
A generic, reusable admin-table pattern (`AdminTable`, `FormModal`/`TabbedFormModal`, `Pagination`, `ActionBar`, `DeleteConfirmDialog`) drives CRUD screens for:

- **Campuses, Faculties, Departments** (departments may be faculty-less for support units), **Courses** (with qualification type — Higher Certificate, Diploma, BSc, BEng, etc.), **Modules**
- **Roles** (9-level hierarchy used by the routing/escalation engine)
- **Staff** and **Students** (mirrored structure: number, title, initials, department, campus, role/course, profile image via S3 upload)
- **Residences** (On-Campus / Off-Campus / External) and **Extracurriculars** (Sports, Indigenous, Religious, Social Justice, Student Governance)

This data is not cosmetic — it is the substrate the complaint-routing engine reads from (which staff belongs to which department/role, which qualifies them for which category of complaint).

#### Landing Page
Marketing pages: `About`, `Blog`/`BlogPost`, `Contact`, `Services`, `Work`, and the primary landing page (`ComplaintSyncLanding`).

#### Shared package (`@complaint-app/shared`)
Cross-app building blocks consumed by all three portal apps: `AuthContext`, `ProtectedRoute` (role-gated routing), `authService` (legacy) / `authService-cognito` (current), and common hooks/utilities — ensuring authentication and route protection behave identically no matter which app the user is in.

### 2.5 Frontend ↔ backend interaction

- All four frontends are Vite dev servers (or static builds) sitting behind the **proxy server**, which is the *only* origin the browser talks to (`localhost:3000`), avoiding CORS entirely in development.
- The proxy routes by path prefix (`/voice/`, `/resolve/`, `/admin/`, default `/`) for frontend assets, and by API prefix (`/api/voice`, `/api/resolve`, `/api/admin`) — plus `Referer`-header sniffing for the shared `/api/auth` and `/api/storage` endpoints — to the correct backend service.
- Each portal's backend (`backend-server.js` for Voice, `backend-resolve.js` for Resolve, `backend-admin[-supabase].js` for Admin) exposes a REST API consumed via React Query hooks (`useComplaints`, `useMessages`, `useProfile`, `useConversations`, `useNotes`, etc.), giving each app caching, background refetch, and optimistic-update behavior out of the box.
- **Real-time updates** bypass polling: Supabase Realtime subscriptions (`postgres_changes` on `complaints`, `complaint_conversations`, `complaint_message_sync`) push changes directly to subscribed clients; a parallel AWS API Gateway WebSocket channel (fed by SQS + Lambda fan-out) provides a redundant push path for presence and bulk notification scenarios.
- **File uploads** never pass binary data through the Express backend: the client requests a **presigned S3 URL** from the proxy (`POST /api/storage/upload-url`), uploads directly to S3, then calls `POST /api/storage/confirm-upload` so the backend can record the resulting object as an attachment (or profile image) in Supabase.

---

## 3. Tech Stack & Services

### 3.1 Frontend

| Layer | Technology |
|---|---|
| Framework | React 18.3 + TypeScript, built with Vite 5.4 |
| Routing | React Router DOM 6.26 |
| UI primitives | Radix UI (~25 packages) styled as a shadcn/ui-style component system |
| Styling | Tailwind CSS 3.4, `tailwindcss-animate`, `class-variance-authority`, `clsx` |
| Server state | TanStack Query 5.83 |
| Client/global state | Zustand 5.0 (e.g. `messageStore.ts` in Campus Voice) |
| Forms & validation | React Hook Form 7.61 + Zod 3.25 |
| Supporting UI libs | Lucide React (icons), Sonner (toasts), date-fns, embla-carousel-react, cmdk, input-otp |

All four apps depend on the internal `@complaint-app/shared` workspace package for auth context, route protection, and common utilities — keeping login, session handling, and role gating consistent across the whole platform.

### 3.2 Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 18, Express 4.18 |
| Primary datastore client | `@supabase/supabase-js` 2.99 |
| AWS integration | `@aws-sdk/client-cognito-identity-provider`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` |
| Auth/session | `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors`, `express-rate-limit` |
| Routing/proxy | `http-proxy` (the top-level `server.js` unified proxy) |
| Testing | Jest 30 + Supertest — integration tests cover attachments, complaints, conversations, messages, profile, and quick notes |
| Legacy (inactive) | Sequelize 6.35 + `pg` — a local-Postgres ORM path retained in the codebase but not connected to any live database (see [§6](#6-appendix-known-gaps--technical-debt)) |

### 3.3 External services & AWS resources

| Service | Purpose | Notes |
|---|---|---|
| **AWS Cognito** — User Pool + App Client | Identity provider for all three portal apps | Custom attributes: `student_number`, `staff_number`, `role`; password policy 8+ chars with upper/lower/number; token validity 1h (access/ID) / 30d (refresh) |
| **AWS S3** | Attachment & profile-image storage | Private bucket, all public access blocked, CORS scoped to app origins, `temp/` prefix auto-expires after 1 day |
| **AWS API Gateway (WebSocket)** | Real-time push channel | Backed by Lambda functions (`wsConnect`, `wsDisconnect`, `wsDefault`, `wsSubscribe`, `wsUnsubscribe`, `wsSubscribeComplaints`, `wsBroadcastComplaint`, `wsAuthorizer`) |
| **AWS DynamoDB** | WebSocket connection registry | Pay-per-request table keyed by `connectionId`, 24h TTL |
| **AWS SQS** | Event fan-out queue (+ dead-letter queue) | Feeds the `eventFanout` Lambda, which broadcasts complaint/communication events to connected WebSocket clients |
| **Supabase (PostgreSQL + Realtime)** | Primary relational datastore and live-change subscription source | 22+ versioned migrations define the full schema; accessed server-side via the Supabase service role key |
| Infrastructure as code | Serverless Framework v3 (`aws/infrastructure/serverless.yaml`) | Defines all Cognito/S3/API Gateway/DynamoDB/SQS/Lambda resources for the `dev` stage |

### 3.4 Data flow & authentication mechanism summary

- **Identity**: AWS Cognito issues RS256-signed JWTs (ID, Access, Refresh). The Express backend verifies tokens in `middleware/auth.js`, builds `req.user`, and enforces role checks.
- **Session storage**: ID/Access tokens in `localStorage`; Refresh token in an httpOnly, Secure cookie — limiting XSS exposure of the long-lived credential.
- **Primary data store**: Supabase/PostgreSQL, accessed through a generic CRUD service (`supabaseService.js`) plus domain services (complaints, quick notes, profiles, routing).
- **File data**: Binary content lives only in S3; PostgreSQL stores metadata and S3 object keys.
- **Real-time propagation**: Supabase `postgres_changes` subscriptions are the primary live-update mechanism; an AWS WebSocket/SQS/Lambda pipeline provides a secondary, redundant channel.
- **Client state management**: TanStack Query owns server-derived state (caching, refetching, mutation); Zustand handles local/global UI state that doesn't belong to the server cache (e.g. active message selection).

---

## 4. Key Technical Decisions & Implementation Details

### 4.1 Single-origin proxy architecture

Rather than deploying four apps behind CORS-laden separate origins, a single Express + `http-proxy` server (`packages/proxy-server/src/server.js`) fronts everything on port 3000, routing by URL path prefix for frontend assets and by path/`Referer` header for API calls:

```
/api/auth/*     → routed to admin/resolve/voice backend based on Referer
/api/admin/*    → backend-admin[-supabase].js   (institutional data)
/api/resolve/*  → backend-resolve.js            (staff/complaint API)
/api/voice/*    → backend-server.js             (student/complaint API)
/api/storage/*  → S3 presigned URL flow, routed by Referer
/voice/*  /resolve/*  /admin/*  → respective frontend dev servers
/  (default)    → landing-page frontend
```

This keeps local development friction low (one URL, no CORS configuration for the browser) while still allowing each app and backend to be developed, tested, and scaled independently.

### 4.2 Feature-flagged migration to Supabase

Rather than a hard cutover, each domain (`profiles`, `complaints`, `quicknotes`, `attachments`, `realtime`) is gated by an independent feature flag (`FEATURE_PROFILES_SUPABASE`, etc.) evaluated in `featureFlagService.js`. Each service checks `isEnabled('FEATURE_X') && service.isEnabled()` before using Supabase, falling back to an earlier in-memory/mock implementation otherwise — allowing the team to migrate data domains to the real database independently and safely roll one back without affecting the others.

### 4.3 Presigned-URL file uploads

Attachments and profile images never transit the Express process as binary payloads. The client requests a presigned PUT URL, uploads directly to S3, then confirms the upload so the backend can persist metadata. Profile images use a longer-lived (7-day) presigned URL at confirmation time and 1-hour presigned URLs on subsequent reads — balancing convenience (avoid re-signing on every profile view) against exposure window.

### 4.4 Complaint routing as a first-class, data-driven engine

Routing and escalation are not hardcoded `if` chains — they're driven by the `complaint_types` and `category_routing` tables (editable, ultimately, through institutional data), with a three-tier rule match (type-specific → category → catch-all) and load-balanced assignment. This means routing behavior can change by editing data (via Campus Admin, once fully wired) rather than shipping code, and every routing/escalation decision is auditable via `escalation_history`.

### 4.5 Idempotent cross-app message sync

`complaint_message_sync` tracks delivery of each message across the two consumer apps (Voice/Resolve) with a `sender_app` check constraint, preventing duplicate delivery or lost updates when both a Supabase Realtime event and an SQS/WebSocket event could otherwise each try to apply the same change.

### 4.6 Recent notable changes

- **`021_complaint_routing_and_sync.sql`** — the load-bearing migration that introduced `complaint_conversations`, `category_routing`, `complaint_message_sync`, `escalation_history`, and `notifications`, turning the platform from a simple complaint log into a routed, escalating, auditable workflow engine.
- **Profile image uploads** — added S3-backed profile pictures for staff and students in Campus Admin, reusing the existing storage service with new upload contexts and a presigned-URL round trip.
- **AWS infrastructure deployment (dev stage)** — Cognito User Pool/Client, S3 bucket, WebSocket API, DynamoDB table, two SQS queues + DLQ, and nine Lambda functions deployed via Serverless Framework; the backend's event publisher was wired into complaint-creation and reply-posting flows.
- **Quick Notes bug-fix pass** — resolved missing-prop, error-handling, and keyboard-input bugs in the note edit modal, and fixed silent S3-object-deletion failures so deleting a note or file attachment now correctly removes both the database record and the underlying S3 object.
- **Signup ↔ pre-registration linking** — new self-signups are matched against admin-pre-loaded student/staff records by email and number, then "claim" that record to seed a canonical profile, closing the gap between institutional data entered by admins and accounts created by end users.

---

## 5. How to Describe the App to Others

### 5.1 One-sentence elevator pitch

> **Campus Voice/Resolve** is a real-time complaint management platform that lets students file and track campus complaints while automatically routing, escalating, and resolving them through a role-aware staff inbox — all under one Cognito identity and a shared institutional data model.

### 5.2 Short paragraph (LinkedIn / CV / email)

> I designed and built a full-stack, multi-app complaint resolution platform for a university campus environment — a student-facing portal, a staff resolution inbox, and an institutional admin console, unified behind a single proxy and shared authentication layer. The system uses AWS Cognito for identity, Supabase/PostgreSQL with Realtime subscriptions for live data sync, and S3 with presigned uploads for attachments, with a data-driven routing and escalation engine that assigns complaints to the right staff member and automatically escalates overdue cases. Built as a pnpm monorepo with React, TypeScript, Vite, TanStack Query, and a Node/Express API layer.

### 5.3 Detailed professional description (GitHub README / portfolio / job application)

> **Complaint Resolution System** is a monorepo-based, multi-application platform that digitizes the end-to-end lifecycle of a campus complaint. It comprises four cooperating single-page applications — a public landing page, a student complaint-filing portal (**Campus Voice**), a staff resolution inbox (**Campus Resolve**), and an institutional administration console (**Campus Admin**) — served behind a unified Express/`http-proxy` gateway so the browser only ever talks to a single origin.
>
> Authentication is handled by a single shared **AWS Cognito** User Pool, giving one account access across all three portal apps with role- and app-specific onboarding flows. Complaints, threaded messages, attachments, quick notes, and the full institutional data graph (campuses, faculties, departments, courses, modules, roles, staff, students) are persisted in **Supabase/PostgreSQL**, with a data-driven routing engine that assigns each complaint to an available, qualified staff member based on category and role hierarchy, and automatically escalates cases that breach their SLA — with a full audit trail. Real-time updates propagate to both the student and staff apps via **Supabase Realtime** `postgres_changes` subscriptions, backed by a redundant **AWS API Gateway WebSocket + SQS + Lambda** fan-out pipeline. File and profile-image uploads use presigned **S3** URLs so binary payloads never transit the application server.
>
> The frontend stack is React 18 + TypeScript on Vite, styled with Tailwind CSS and a Radix-UI/shadcn-style component system, using TanStack Query for server-state management, Zustand for client state, and React Hook Form + Zod for form validation — with a shared internal package (`@complaint-app/shared`) providing consistent authentication context and role-gated routing across every app. The backend is Node.js/Express with a Jest + Supertest integration test suite, and all AWS infrastructure (Cognito, S3, API Gateway, DynamoDB, SQS, Lambda) is defined as code via the Serverless Framework.

### 5.4 Feature highlights (bullet form)

- **Four cooperating apps, one origin** — landing page, student portal, staff portal, and admin console, unified through a single routing proxy.
- **Single sign-on across all portals** — one AWS Cognito identity works across student, staff, and admin apps, each with tailored onboarding requirements.
- **Data-driven complaint routing & escalation engine** — automatically assigns complaints by category and role hierarchy, load-balances across staff, and escalates SLA-breaching cases with a full audit trail.
- **True real-time collaboration** — student and staff threads update live via Supabase Realtime, with a redundant AWS WebSocket channel for resilience.
- **Secure, direct-to-S3 file uploads** — presigned URLs for complaint attachments and profile images, with no binary payloads passing through the API server.
- **Full institutional data console** — campuses, faculties, departments, courses, modules, roles, staff, students, residences, and extracurriculars, all CRUD-managed and directly wired into complaint routing.
- **Feature-flagged, incremental backend migration** — each data domain independently toggled between mock and Supabase-backed implementations, enabling safe, staged rollout.
- **Quick Notes case-management workspace** — staff-side notes with file and link attachments, search, and full edit/view/delete lifecycle.

---

## 6. Appendix: Known Gaps & Technical Debt

For transparency, the following items are documented gaps as of this writing and are worth tracking as the system matures:

- A legacy Sequelize/local-PostgreSQL code path remains in the backend but is not connected to any live database; it is bypassed rather than removed.
- `staffProfileService.js` targets a `staff_profiles` table that was created and dropped in the same migration set — its calls fail silently and fall through to the working Supabase-backed profile path.
- Role-based route protection (`ProtectedRoute`'s `requiredRoles`) has historically been under-enforced; work to fully wire it up is in progress.
- The "Ask-Tut" AI assistant surface in Campus Resolve is UI/API scaffolding only — no model is connected yet.
- Supabase Row-Level Security policies exist in migrations but are not the active access-control mechanism, since the backend currently authenticates to Supabase with the service role key.
- Uploaded profile images are not cleaned up in S3 when replaced, leaving orphaned objects.
- Campus Admin's table UI has two divergent implementations (a production pattern and an experimental "tabbed" pattern); consolidating on one is a recommended follow-up.
- Cognito OAuth callback URLs are currently scoped to `localhost` only and will need updating before any staging/production deployment.

*Documentation compiled from the current codebase (`packages/`, `aws/`, `supabase/migrations/`) and the project's internal architecture notes in `docs/`.*
