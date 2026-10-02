# 🎓 SkillSwap Campus

**SkillSwap Campus** is a peer-to-peer skill exchange platform designed for college students to teach what they know, learn what they need, share academic resources, and build meaningful peer connections on campus.

---

## ✨ Features

- 🎯 **Complementary Matchmaking**: Automated matching algorithm calculating match percentages between students who want to teach and learn complementary skills.
- 🔍 **Skill Discovery**: Search, filter by category (Programming, Design, Languages, Academics, Music, etc.), and browse detailed student profiles.
- 💬 **Real-time Peer Chat**: In-app messaging system for scheduled practice, discussions, and peer collaboration.
- 📅 **Session Planner**: Book and track 1-on-1 skill exchange sessions (video call or in-person).
- 📄 **Notes & Study Resource Hub**: Upload, search, and share study notes, assignment guides, and reference documents.
- ⭐ **Ratings & Reviews**: Peer evaluation and feedback system to build trust within the campus community.
- 🔔 **Notification Center**: Real-time notifications for match requests, messages, session updates, and system alerts.
- ⚡ **Dual Engine (Local Demo & Live Cloud)**: 
  - **Local Mode**: Works instantly using browser `localStorage` with rich pre-loaded seed data.
  - **Live Cloud Mode**: Seamlessly connects with **Supabase** for live multi-user authentication and database persistence.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Radix UI, Lucide Icons, Wouter
- **Backend**: Node.js 24, Express 5, Drizzle ORM, Zod, PostgreSQL / Supabase
- **Monorepo / Package Manager**: `pnpm` Workspaces

---

## 📁 Repository Structure

```
skillswap-campus/
├── artifacts/
│   ├── skillswap/          # Frontend React Application (Vite + Tailwind)
│   ├── api-server/         # Express API Server (Node.js + Drizzle ORM)
│   └── mockup-sandbox/     # Sandbox UI components
├── lib/                    # Shared workspace libraries (DB schemas, API Zod schemas)
├── scripts/                # Development & build utility scripts
├── LIVE_SETUP.md           # Supabase live production setup guide
├── supabase-live-migration.sql # Database migration SQL schema for Supabase
├── pnpm-workspace.yaml     # Workspace configuration
└── package.json            # Root workspace scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- `npm` or `pnpm`

### 1. Installation

Clone the repository and install dependencies:

```bash
cd skillswap-campus-main
npm install
```

### 2. Running the Frontend (Local Development)

Start the Vite development server:

```bash
npm --prefix artifacts/skillswap run dev
```

Open your browser at: **`http://localhost:5173/`**

> **Note**: In local demo mode, SkillSwap runs out-of-the-box using local storage and pre-configured demo student accounts.

### 3. Running the Backend API Server (Optional)

If you are running the backend API server:

```bash
npm --prefix artifacts/api-server run dev
```

---

## ☁️ Live Cloud Deployment (Supabase & Vercel)

To run SkillSwap with live user authentication and cloud database storage:

1. **Database Setup**:
   - Open `supabase-live-migration.sql` in your [Supabase Dashboard](https://supabase.com) SQL Editor and execute it.

2. **Environment Variables**:
   - Copy `artifacts/skillswap/.env.example` to `artifacts/skillswap/.env` (or configure in Vercel):
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
     ```

3. **Authentication Settings**:
   - In Supabase Dashboard → Authentication → Sign In / Providers → Email, turn **Confirm email** OFF (for direct friction-free login).

Detailed instructions are available in [LIVE_SETUP.md](./LIVE_SETUP.md).

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start Frontend** | `npm --prefix artifacts/skillswap run dev` | Launch Vite Dev Server (`localhost:5173`) |
| **Start API Server** | `npm --prefix artifacts/api-server run dev` | Launch Express API Server |
| **Typecheck** | `npm run typecheck` | Run TypeScript check across all workspace packages |
| **Build Frontend** | `npm --prefix artifacts/skillswap run build` | Bundle frontend for production |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
