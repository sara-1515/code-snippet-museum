# Code Snippet Museum

A beautiful platform for developers to share their legendary code snippets with stories.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (Supabase)
- Deployment: Vercel

## Local Development

### Prerequisites
- Node.js 16+
- PostgreSQL database (Supabase account)

### Setup
1. Clone repository
2. Install dependencies:
```bash
   cd client && npm install
   cd ../server && npm install
```
3. Create `server/.env` file with DATABASE_URL
4. Run database schema in Supabase
5. Start development:
```bash
   # Terminal 1 - Frontend
   cd client && npm start

   # Terminal 2 - Backend
   cd server && npm run dev
```

## Deployment
See DEPLOYMENT.md for Vercel deployment instructions.