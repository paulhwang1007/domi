# Domi - The Second Brain for Your Browser

Domi is an AI-powered "second brain" that helps you effortlessly capture, organize, and interact with your digital life. It bridges the gap between chaos and clarity by turning your scattered browser tabs into a structured, intelligent library.

**[Visit Live Demo](https://domi-ai.vercel.app/)**

![Domi Dashboard Preview](./web/public/domi_icon.png)

## ✨ Key Features

### 🧠 AI Auto-Organization
- **Smart Tagging**: Automatically categorizes content based on context.
- **Auto-Summarization**: Generating concise summaries for articles and videos.
- **Title Enhancement**: Replaces clickbait titles with descriptive ones.
- **Image Extraction**: automatically pulls cover images from OpenGraph tags and YouTube thumbnails.

### ⚡ Instant Capture (Chrome Extension)
- **One-Click Save**: Bookmark the current page instantly.
- **Context Menu Integration**: Right-click to save images, links, or text highlights.
- **Keyboard Shortcuts**: Use `Alt+D` (or custom hotkey) for rapid capture.
- **Seamless Auth**: Automatically shares authentication with the web dashboard.

### 🎨 Modern Dashboard
- **Masonry Feed**: beautifully curated visual grid of your memories.
- **Chat with Context**: Ask questions about your saved content (e.g., "What was that react article about?").
- **Groups & Collections**: Organize related memories into custom groups.
- **Search**: Powerful keyword and tag-based search.

## 🛠 Tech Stack

### Web App (`/web`)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **State**: React Hooks + Supabase Realtime
- **Icons**: Lucide React

### Backend (`/supabase`)
- **Database**: Postgres (Supabase) with `pgvector` for potential future embeddings.
- **Auth**: Supabase Auth (Email/Password + OAuth).
- **Edge Functions**: Deno-based typescript functions for AI processing (`ingest-clip`, `chat-with-clip`).
- **AI**: Google Gemini Pro (via `@google/generative-ai`).

### Chrome Extension (`/extension`)
- **Manifest**: V3
- **Communication**: PostMessage access to Web Dashboard storage for auth tokens.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI
- Docker (for local Supabase dev)

### 1. Setup Supabase (Local)
```bash
# Install dependencies
npm install

# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset
```

### 2. Setup Web Dashboard
```bash
cd web
npm install

# Create .env.local
cp .env.example .env.local
# Add your NEXT_PUBLIC_SUPABASE_URL and ANON_KEY from `supabase status` output
```

Run the development server:
```bash
npm run dev
# Open http://localhost:3000
```

### 3. Setup Chrome Extension
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer Mode** (top right).
3. Click **Load Unpacked**.
4. Select the `/extension` directory in this project.
5. Create a `config.js` in `/extension` with your Supabase credentials:
   ```javascript
   const CONFIG = {
       SUPABASE_URL: "http://127.0.0.1:54321", // Or your cloud URL
       SUPABASE_KEY: "your-anon-key",
       WEB_URL: "http://localhost:3000",
       PROJECT_REF: "your-project-ref" // e.g. '127.0.0.1' for local
   };
   ```

## 📦 Deployment

### Web App
Deploy to Vercel or any Next.js compatible host. Remember to update environment variables.

### Supabase
```bash
supabase link --project-ref <your-project-id>
supabase db push
supabase functions deploy ingest-clip --no-verify-jwt
supabase functions deploy chat-with-clip --no-verify-jwt
```

## 🔒 Security
- **RLS**: Row Level Security is enabled on all tables. Users can ONLY access their own data.
- **Edge Functions**: Authentication is verified via JWT before processing any AI request.

## 🤝 Contributing
Built by Paul Hwang.