# Widget Platform — Frontend (Steps 1 & 2)

React + Vite + Tailwind CSS frontend covering:

- **Step 1 — Owner accounts**: register, log in, session persisted via JWT in
  localStorage, restored on refresh via `GET /api/auth/me`.
- **Step 2 — Widget management**: create/list/edit/delete widgets, each with a
  copyable embed `<script>` snippet.

Talks to the Express + Postgres backend built earlier (`flyrank-capstone-widget-platform`).

## Structure

```
src/
  api/authApi.js        fetch wrapper for /api/auth/*
  api/widgetsApi.js      fetch wrapper for /api/widgets/*
  context/AuthContext.jsx  session state: token, tenant, register/login/logout
  components/
    ProtectedRoute.jsx   redirects to /login if not authenticated
    AppLayout.jsx         shared nav shell for authenticated pages
    FormField.jsx         shared label + input + error wrapper
    EmbedSnippet.jsx       copyable <script> tag display
    WidgetForm.jsx         shared create/edit widget form
  pages/
    RegisterPage.jsx / LoginPage.jsx   Step 1
    DashboardPage.jsx                  post-login landing
    WidgetsListPage.jsx                Step 2 — list + edit/delete
    CreateWidgetPage.jsx / EditWidgetPage.jsx
```

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Make sure the backend is running first (`docker compose up -d && npm run migrate && npm run dev`
in the backend project) at the URL set in `.env` (`VITE_API_BASE_URL`, defaults to
`http://localhost:4000`).

Open `http://localhost:5173/register` to create an account, then you'll land on
`/dashboard` and can create widgets at `/widgets`.
