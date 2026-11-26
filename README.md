# TEAM CORE

Team workspace: tasks, submissions with file upload and review, ideas with voting, a project database, shared files, discussions, calendar, members and an activity feed. Built with Next.js (App Router, server actions) and PostgreSQL.

## Login
Demo accounts use the password `TeamCore#2026`.
Admin: adham.aiman@teamcore.dev
Leader: mariam.ali@teamcore.dev
Member: ahmed.hassan@teamcore.dev

## Architecture
- app/: pages (server components) and API routes
- lib/actions.js: all mutations as server actions with role checks
- lib/db.js + lib/schema.js: Postgres connection, schema, first-run seed
- lib/password.js: scrypt hashing and signed session cookie
- Files are stored in Postgres (max 3 MB each) and served from /download/[id]
- Roles: admin, leader, member

## Run locally
npm install
npm run dev
Without DATABASE_URL it uses an embedded local Postgres (PGlite) in .pgdata.

## Deploy free (Neon + Vercel)
1. Create a free Neon project and copy its connection string.
2. Push this repo to GitHub.
3. On Vercel, import the repo (Hobby plan is free).
4. In Environment Variables add DATABASE_URL (the Neon string) and SESSION_SECRET (any long random text).
5. Deploy. Tables and demo data are created on the first request.
