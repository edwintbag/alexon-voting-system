# Alexon Group — Employee of the Month Voting System

A full-stack internal voting platform for recognising Alexon Group's best-performing employees monthly.

---

## 📁 Project Structure

```
alexon-voting-system/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   ├── vote/
│   │   └── page.tsx               # Multi-step voting wizard
│   ├── admin/
│   │   └── page.tsx               # Admin dashboard
│   └── api/
│       ├── voting-status/route.ts  # Voting window status
│       ├── votes/route.ts          # Submit & retrieve votes
│       ├── employees/route.ts      # Get employees by category
│       └── admin/
│           ├── results/route.ts    # Aggregated results + scoring
│           └── export/route.ts     # CSV export
├── components/
│   ├── voting/
│   │   ├── StepIndicator.tsx
│   │   ├── StepVoterInfo.tsx
│   │   ├── StepCategory.tsx
│   │   ├── StepEmployee.tsx
│   │   ├── StepRating.tsx
│   │   ├── StepSubmit.tsx
│   │   └── SuccessScreen.tsx
│   ├── admin/
│   │   ├── AdminAuth.tsx
│   │   ├── StatsBar.tsx
│   │   ├── LeaderboardTable.tsx
│   │   └── VoteChart.tsx
│   └── ui/
│       ├── AlexonHeader.tsx
│       └── CardWrapper.tsx
├── lib/
│   ├── prisma.ts                   # Prisma singleton
│   └── scoring.ts                  # Scoring engine
├── prisma/
│   ├── schema.prisma              # Database models
│   └── seed.ts                    # Mock employee data
├── styles/
│   └── globals.css
├── types/
│   └── index.ts                   # TypeScript types + constants
├── utils/
│   └── validation.ts              # Zod schemas
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd alexon-voting-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/alexon_voting"
ADMIN_SECRET="your-secure-admin-password"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
VOTE_WINDOW_START=25
VOTE_WINDOW_END=30
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed mock employees
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🗳️ How Voting Works

1. **Voter Info** — Enter your name, department, and optional staff number
2. **Category** — Choose Block/Cabros Production, Non-Machine Production, or Team Leader
3. **Employee** — Select the candidate (self-vote is blocked)
4. **Rate** — Score 5 criteria on a 1–5 star scale
5. **Submit** — Review and confirm

**Rules:**
- One vote per employee per category per month
- No self-voting (frontend + backend enforced)
- Voting only open 25th–30th of each month
- All validation happens server-side

---

## 📊 Scoring Formula

```
Final Score = (Average Rating × 70%) + (Normalized Vote Count × 30%)

Vote count is normalized to a 0–5 scale relative to the category maximum,
keeping it comparable to the 1–5 rating scale.
```

---

## 🧠 Admin Dashboard

Navigate to `/admin` and enter the `ADMIN_SECRET` password.

Features:
- Stats overview (total votes, unique voters, period)
- Analytics charts (votes by category, top performers)
- Leaderboard per category with final scores and ranking
- Filter by month and year
- Export to CSV

---

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| `Employee` | Candidate records with department and category |
| `Vote` | Individual vote with voter info and computed avg rating |
| `Rating` | Individual criterion scores (1–5) |
| `MonthlyResult` | Aggregated results snapshot (optional caching) |

---

## 🔒 Security Notes

- Admin route protected by secret key (env variable)
- Vote deduplication enforced at DB level (unique constraint)
- Self-vote prevented at both frontend and backend
- All inputs validated with Zod schemas
- Voting window enforced server-side

---

## 🚀 Production Deployment

```bash
npm run build
npm start
```

Recommended: Deploy to **Vercel** + **Neon** (serverless PostgreSQL)

```bash
# Migrate in production
DATABASE_URL="..." npx prisma migrate deploy
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, custom design system |
| Animations | Framer Motion |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL |
| Charts | Recharts |
| Validation | Zod |

---

*Built for Alexon Group Internal Use · 2024*
