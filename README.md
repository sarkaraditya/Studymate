# StudyMate AI (Next.js + Backend)

Full-stack study platform featuring Google Account sign-in, persistent database storage with Prisma & SQLite, saved notes history, and AI Tutor chat history.

## Quick Start

```bash
npm install
npx prisma db push          # creates/syncs database tables in dev.db
npm run dev                 # open http://localhost:3000
```

> **Note:** A secure `AUTH_SECRET` has already been generated and saved in your `.env` file. You can test immediately using the "Sign in as Demo Student" button on `/login`, or configure Google OAuth credentials below to log in with real Google accounts.

---

## 1. Google Account Sign-In Setup (2 minutes)

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create a new project or select an existing one.
3. Configure the **OAuth consent screen** (Select *External*, set App Name to "StudyMate AI", and add your own Google email as a test user).
4. Go to **Credentials → Create Credentials → OAuth client ID**.
5. Select **Application type: Web application**.
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google`
   - *(Optional for production)*: `https://YOUR-DOMAIN/api/auth/callback/google`
7. Click **Create** and copy your **Client ID** and **Client Secret**.
8. Open your `.env` file and set:
   ```env
   AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   ```
9. Restart your dev server (`npm run dev`). You can now click **Continue with Google** to sign in!

---

## 2. AI Tutor Configuration (Optional)

In `.env`, set either key:
- `GEMINI_API_KEY="your-gemini-key"` (recommended)
- `ANTHROPIC_API_KEY="your-claude-key"`

*If neither key is set, the tutor returns a helpful mock reply so you can test chat saving and notes history with zero setup.*

---

## 3. Cloud Database Setup (PostgreSQL)

StudyMate uses a cloud **PostgreSQL** database so users can register, sign in from any device or browser anywhere in the world, and instantly retrieve their past study notes, AI tutor chat history, and seamlessly continue any previous conversation.

### Option A: Neon Serverless Postgres (Recommended - 30 seconds, Free)
1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a project named `studymate`.
3. Copy your pooled connection string (format: `postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require`).
4. Paste it in your `.env` file as `DATABASE_URL`.

### Option B: Supabase (Free)
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → Database**, copy the **URI** connection string.
3. Paste it in your `.env` file as `DATABASE_URL`.

### Syncing Tables & Migrating Existing Data:
```bash
# 1. Create all tables in the cloud database
npm run db:push

# 2. (Optional) Migrate your previous local conversations and accounts into the cloud
npm run db:migrate-to-cloud
```

### Database Models:
- **`User`**: User profile (ID, name, email, Google avatar image).
- **`Account`**: Linked Google OAuth credentials & tokens managed by `@auth/prisma-adapter`.
- **`Note`**: Saved study notes (`id`, `userId`, `title`, `content`, `conversationId`, `createdAt`, `updatedAt`).
- **`Document`**: Uploaded notes and PDFs with extracted text content and estimated page counts.
- **`Quiz`**: AI-generated practice quizzes (`id`, `userId`, `title`, `documentId`, `questions`, `score`, `total`, `createdAt`, `updatedAt`).
- **`Conversation`**: AI Tutor chat sessions (`id`, `userId`, `title`, `createdAt`, `updatedAt`).
- **`Message`**: Individual messages within a chat (`id`, `conversationId`, `role`, `content`, `vote`, `createdAt`).

To explore database tables in a visual GUI, run:
```bash
npm run db:studio
```

---

## 4. Backend Endpoints

Every API route checks session authentication via `auth()` and isolates data to the authenticated `userId`:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` / `POST` | `/api/auth/[...nextauth]` | Auth.js handlers for Google OAuth & demo sessions |
| `GET` | `/api/history` | Unified chronological history of both Notes and Tutor Chats with search & type filtering |
| `GET` | `/api/notes` | List user's saved notes with search (`?q=...`) |
| `POST` | `/api/notes` | Create a note linked to user (and optional conversation) |
| `GET` / `PATCH` / `DELETE` | `/api/notes/[id]` | View, edit, or delete an existing note |
| `GET` | `/api/conversations` | List user's past chats with message counts |
| `GET` / `DELETE` | `/api/conversations/[id]` | Open a conversation with full message log or delete it |
| `POST` | `/api/chat` | Send a prompt to AI tutor and persist questions & answers to the database |
| `GET` / `POST` | `/api/quizzes`, `/generate` | List quizzes or generate a new practice quiz from notes with AI |
| `GET` / `PATCH` / `DELETE` | `/api/quizzes/[id]` | Open a quiz, update test score, or delete quiz |
| `PATCH` | `/api/messages/[id]` | Store 👍/👎 feedback for AI answers |
| `GET` | `/api/stats` | Dashboard statistics (total chats, questions asked, saved notes, recent activity) |

---

## 5. Checking Your History When Logged In

1. **History Page (`/history`)**:
   - Filter tabs: **All History**, **Notes History**, and **Tutor Chats**.
   - Search bar: Real-time search matching both note content and chat conversations.
   - Quick Actions: One-click "Open Note" (takes you to the editor) or "Open Chat" (takes you to tutor conversation), plus Delete buttons.
2. **Notes Page (`/notes`)**:
   - Side-by-side notes list and editor.
   - Auto-opens selected note from History.
   - Save updates directly to SQLite.
3. **Dashboard (`/dashboard`)**:
   - Live counters for Chats, Questions Asked, and Notes Saved.
   - One-click shortcuts to resume your latest AI tutor conversation or continue editing your most recent note.
