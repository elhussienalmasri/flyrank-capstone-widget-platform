# Flyrank Capstone Widget Platform

A full-stack platform for creating embeddable widgets — lead-capture forms, real
visitor accounts, and call-to-action banners — that any website owner can drop
into their site with a single `<script>` tag.


---

## 1. 📝 Description

Widget Platform lets a business owner ("tenant") sign up, create one or more
widgets, and embed them on their own website (or any customer's website) with
one line of code. Depending on the widget type, visitors on that external site
can subscribe to a mailing list, fill out a custom lead form, create a real
password-protected account, or log back into one.

Every submission and every visitor account flows back into the owner's
dashboard — filterable, exportable-by-view, and deletable — along with
aggregate stats (submissions, visitors, countries reached, total widgets).

A separate **platform-admin** role (still just a regular account, gated by a
`role` flag) can see every tenant on the platform and permanently remove an
account, cascading its widgets, submissions, and visitors.

## 2. 🧑‍💻 Roles

| Role | Who they are | What they can do |
|---|---|---|
| **Tenant owner** | A business using the platform to publish widgets. | Register and log in, create and manage widgets, view dashboard data, manage submissions and visitors, and configure widget behavior. |
| **Visitor** | A person interacting with a widget on a tenant's website. | Submit lead-capture forms, create an account through a signup widget, and log in through a linked login widget. |
| **Platform admin** | A tenant account configured with the `admin` role. | View all tenant accounts and permanently delete an account together with its widgets, submissions, and visitor data. |

### 👨‍💼 Create a platform admin

Set these values in `backend/.env` before starting the backend:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-long-unique-password
```

On startup, the backend creates that account if it does not exist, or promotes
an existing account with the same email to the `admin` role. Log in through the
normal `/login` page with those credentials; the application then routes the
admin to the account-management screen automatically. 

Once logged in, an admin can use the Change password action to update their password securely.

## 3. ✨ Features

**Owner-facing**
- Email/password auth for tenant accounts, with optional email verification
  required *before* the account is created (configurable)
- Forgot-password and reset-password flows when `EMAIL_FEATURES_ENABLED=true`
  and SMTP delivery is configured; change-password is available after login
- Full widget CRUD across 5 types (see the [widget types table](#widget-types-created-from-the-dashboard-embedded-via-script))
- A field editor for building custom lead-capture forms, with per-field
  `required` toggles and a minimum of one field enforced
- A dashboard with live stats: total submissions, total visitors, countries
  reached, total widgets
- A submissions inbox, filterable by widget, with edit and delete
- A visitors list (registered accounts from signup widgets), filterable by
  widget when there's more than one signup widget, with delete
- Popover triggers: on click, after a time delay, or after a scroll depth
- Per-widget appearance controls (CTA banner accent color, thank-you button
  color, thank-you message + link)

**Visitor-facing (on the embedding customer website)**
- One-line `<script>` embed — no iframe, no build step required on the
  customer's side
- Lead-capture forms (`subscribe`, `cta`, `popover`) that POST straight to the
  platform, protected by a honeypot, rate limiting, and IP-based geo enrichment
  with a two-provider fallback chain
- Real signup/login widgets with hashed passwords and JWT sessions, scoped
  per-widget (the same email can hold separate accounts on two different
  signup widgets)
- Optional email verification for signup widgets: a 6-digit code entered
  directly in the widget — never a link that would send the visitor away from
  the site they're actually on



## 4. 🛠️ Technologies

| Layer | Stack |
|---|---|
| Backend | Node.js, Express (ES modules), `pg`, JWT (`jsonwebtoken`), `bcrypt`, `zod`, `express-rate-limit`, `nodemailer` |
| Database | PostgreSQL, Docker Compose |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Embeddable widget | Vanilla JavaScript (no framework, no build step) — served as a static file by the backend |
| Email | Pluggable: console logger (dev default) or real SMTP via `nodemailer` |
| Geo enrichment | ip-api.com (primary) → ipapi.co (fallback), with a deterministic mock provider for tests. Location is empty during local testing because the device IP is `localhost` (`127.0.0.1`); geo providers cannot locate local IPs, so the code skips enrichment for them. |

## 5. 📦 Installation

### 1. 📥 Clone the repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. ⚙️ Configure environment variables

Inside the `backend` directory, create the `.env` file:

```bash
cd backend
cp .env.example .env
```

### 3. 📚 Install dependencies

Install the backend dependencies:

```bash
cd backend
npm install
```

Install the frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## 6. ▶️ Running the Project

This project can run in two ways: locally with npm, or with Docker. This guide
uses npm; pnpm or Bun can be used instead.

### 1. 💻 Run locally with npm

Configure the backend environment by reviewing the variables in
`backend/.env.example`, then copy it to `backend/.env` and set the values
needed for your setup.

```bash
cd backend
cp .env.example .env
npm install
```

Start PostgreSQL, then run the migrations, seed data, and backend:

```bash
npm run migrate
npm run seed
npm run dev
```

Runs at `http://localhost:4000`.

In a second terminal, start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

### 2. 🐳 Run the full stack with Docker

Docker uses environment variables for database settings and application
configuration. Review `backend/.env.example`, then create the root `.env` file
and set the values needed for your setup.

From the project root folder, create the Docker `.env` file:
```bash
cp backend/.env.example .env
```

Start the database, backend, migrations, seed data, and frontend with one
command:

```bash
docker compose up --build
```

Open `http://localhost:5173`. The API is available at
`http://localhost:4000`.


### 🌱 Add demo data (optional)

Run this command to create a demo owner, one widget of every type, and three
distinct sample submissions for every widget in the database. No data needs to
be created manually. It is safe to run again: it reuses the demo data and only
adds missing sample submissions up to three per widget.

```bash
npm run seed
```

The demo owner can sign in with `demo@widget-platform.local` and
`DemoPassword123!`.


## 7. 🧪 Run backend tests

```bash
cd backend
npm run test
```

---

## 8. 🗂️ Project Structure

```text
widget-platform
├── BUILDLOG.md
├── EVIDENCE.md
├── README.md
├── backend
│   ├── Dockerfile
│   ├── capstone.yaml
│   ├── customer-site-fixture
│   │   ├── index.html
│   │   └── popover-demo.html
│   ├── migrations
│   │   ├── 001_init.sql
│   │   ├── 002_widgets.sql
│   │   ├── 003_submissions.sql
│   │   ├── 004_widget_visitors.sql
│   │   ├── 005_update_widget_types.sql
│   │   ├── 006_tenant_email_auth.sql
│   │   ├── 007_widget_visitors_email_auth.sql
│   │   ├── 008_pending_registrations.sql
│   │   ├── 009_pending_widget_visitors.sql
│   │   ├── 010_tenant_role.sql
│   │   ├── 011_widget_visitors_widget_id.sql
│   │   ├── 012_widget_scoped_visitor_identity.sql
│   │   └── 013_visitor_verification_code.sql
│   ├── package.json
│   ├── public-widget
│   │   └── widget.v1.js
│   ├── src
│   │   ├── app.js
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── providers
│   │   ├── repositories
│   │   ├── routes
│   │   ├── schemas
│   │   ├── server.js
│   │   ├── services
│   │   └── utils
│   ├── tests
│   │   ├── accountAuth.test.js
│   │   ├── admin.test.js
│   │   ├── auth.test.js
│   │   ├── enrichment.test.js
│   │   ├── helpers
│   │   ├── public.test.js
│   │   ├── submissions.test.js
│   │   ├── visitorAuth.test.js
│   │   └── widgets.test.js
│   └── vercel.json
├── docker-compose.yml
├── evidence
│   └── screenshots
│       ├── 09-subscribe-to-demo-account.png
│       ├── 11-demo-subscription-submission.png
│       ├── cors-preflight-options.png
│       ├── evidance-1.png
│       ├── evidance-2.png
│       ├── geo-provider-fallback-test.png
│       ├── geo-providers-down-degrade-test.png
│       ├── honeypot-spam-prevention-test.png
│       ├── malformed-submission-json-error.png
│       ├── notification-failure-submission-stored-test.png
│       ├── oversized-submission-validation-test.png
│       ├── public-config-cache-headers.png
│       ├── public-widget-config-cache-headers.png
│       ├── rate-limit-201-429.png
│       ├── submissions.png
│       ├── subscribe-to-demo-success.png
│       ├── subscribe-to-demo.png
│       ├── valid-submission-customer-success.png
│       ├── valid-submission-customer.png
│       ├── valid-submission-test.png
│       ├── widget-creation-auth-rejected-test.png
│       └── widget-owner-crud-test.png
└── frontend
    ├── Dockerfile
    ├── README.md
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── src
    │   ├── App.jsx
    │   ├── api
    │   ├── components
    │   ├── context
    │   ├── index.css
    │   ├── main.jsx
    │   └── pages
    ├── tailwind.config.js
    ├── vercel.json
    └── vite.config.js
```
---
## 9. 🧩 Widgets and Pages

### 🧩 Widget types (created from the dashboard, embedded via `<script>`)

| Type | What it collects | Where the visitor lands | Notes |
|---|---|---|---|
| `subscribe` | Email (always required) + optional name | Inline on the page, popup confirms success | Locked to at most 2 fields — name and email only |
| `signup` | Name, email, password, confirm password | Inline; code-entry step if verification is on | Real account, hashed password, JWT issued |
| `login` | Email, password | Inline | Authenticates against a linked signup widget's accounts, or the first-created signup widget when only one signup widget exists |
| `cta` | Owner-defined custom fields | Inline colored banner; a popup confirms success after submission | Owners can add up to 20 custom fields and configure the thank-you popup's title, message, optional link button, and button color |
| `popover` | Owner-defined custom fields | Hidden until triggered (click / delay / scroll), then a modal | Configurable thank-you popup with title, message, and an optional link button in any chosen color |

### 🖥️ Frontend pages

| Page | Path | Auth required |
|---|---|---|
| Home page | `/` | No (redirects to `/dashboard` if already logged in) |
| Register | `/register` | No |
| Login | `/login` | No (routes to `/admin/accounts` or `/dashboard` based on role) |
| Verify email | `/verify-email` | No |
| Forgot password | `/forgot-password` | No — email only; requires `EMAIL_FEATURES_ENABLED=true` and configured SMTP |
| Reset password | `/reset-password` | No |
| Change password | `/change-password` | Yes |
| Dashboard | `/dashboard` | Yes |
| Widgets list | `/widgets` | Yes |
| Create widget | `/widgets/new` | Yes |
| Edit widget | `/widgets/:id/edit` | Yes |
| Submissions | `/submissions` | Yes |
| Visitors | `/visitors` | Yes |
| Admin accounts | `/admin/accounts` | Yes, `role: admin` only |

### 🧭 Backend API routes

| Route group | Base path | Auth |
|---|---|---|
| Owner auth | `/api/auth/*` | Mixed — register/login public, rest require a token |
| Widgets (CRUD) | `/api/widgets/*` | Tenant token |
| Dashboard (stats, submissions, visitors) | `/api/dashboard/*` | Tenant token |
| Account overview | `/api/account` | Tenant token |
| Admin | `/api/admin/*` | Tenant token, `role: admin` |
| Public widget delivery | `/widget.js`, `/widgets/:id/config` | None (public, cached) |
| Visitor auth | `/widgets/:id/signup`, `/widgets/:id/login`, `/widgets/:id/verify-email`, `/widgets/:id/forgot-password`, `/widgets/:id/reset-password` | None (public, cross-origin) |
| Submissions intake | `/submissions` | None (public, cross-origin, rate-limited) |

---

### 🌐 Customer website test fixtures

The test customer websites are located in:

```text
backend/customer-site-fixture/
```

- `index.html` — tests embedded widgets on a simple customer website.
- `popover.html` — tests the popover widget on a simple customer website.
