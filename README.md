# 🛍️ AI Product Search

> **Production-Ready Portfolio Project**: Semantic search engine with AI embeddings, vector database, and comprehensive test coverage

**Status:** ✅ **LIVE & TESTED** - 142 tests, 94% coverage

## 🎯 Features

- ⚡ **Semantic Search** - AI-powered product discovery using OpenAI embeddings
- 🔍 **Smart Filtering** - Price, brand, category with real-time updates
- 💨 **Redis Caching** - 70% cache hit rate, <50ms cached responses
- 🔐 **Production Security** - Rate limiting (10/10min), budget caps, input validation
- 🧪 **Tested** - 106 unit + 36 integration tests, 94%+ coverage
- 📊 **50+ Products** - Real athletic shoes with detailed metadata

## 🚀 Tech Stack

**Frontend:**

- Next.js 15 (App Router) • React 19 • TypeScript • Tailwind CSS

**Backend:**

- OpenAI Embeddings API • Pinecone Vector DB • Vercel KV (Redis)

**Testing:**

- Jest • Testing Library • MSW (Mock Service Worker)

**Deployment:**

- Vercel • Production-ready with monitoring

## 📋 Quick Start

### Prerequisites

- Node.js 18+ • npm/yarn
- OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))
- Pinecone account ([pinecone.io](https://app.pinecone.io/))

### Installation

```bash
npm install
cp .env.local.example .env.local
# Add your API keys and configuration to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=your-embedding-model
OPENAI_EMBEDDING_DIMENSIONS=your-dimensions
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=your-index-name

# Optional
PINECONE_NAMESPACE=your-namespace

# Vercel KV (Redis) - auto-configured on Vercel
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## 📁 Project Structure

```
ai-product-search/
├── app/
│   ├── page.tsx                    # Home page
│   ├── search/page.tsx             # Search results
│   └── api/search/route.ts         # Search API endpoint
├── components/
│   ├── SearchBar.tsx               # Search input
│   ├── ProductCard.tsx             # Product card
│   ├── FilterSidebar.tsx           # Filters
│   ├── ProductGrid.tsx             # Product grid
│   └── ActiveFilters.tsx           # Applied filters
├── tests/
│   ├── unit/                       # 106 unit tests
│   ├── integration/                # 36 integration tests
│   ├── mocks/                      # MSW handlers
│   └── setup/                      # Test configuration
└── lib/
    ├── types.ts                    # TypeScript types
    ├── openai.ts                   # OpenAI client config
    ├── pinecone.ts                 # Pinecone client config
    └── ratelimit.ts                # Rate limiting
```

## 🧪 Testing

**142 tests total** • **94%+ coverage**

### Unit Tests (106 tests)

```bash
npm run test:unit              # Run unit tests
npm run test:coverage          # With coverage report
```

- Components: SearchBar, ProductCard, FilterSidebar, ProductGrid, ActiveFilters
- Pages: Home, Search Results • Edge cases: empty states, errors, loading

### Integration Tests (36 tests)

```bash
npm run test:integration       # Run integration tests
```

- MSW for API mocking • Full user flows: search, filter, navigation
- All components exceed 70% threshold

## 🔐 Security Features

- **Rate Limiting:** 10 requests/10min per IP (Upstash)
- **Budget Cap:** OpenAI hard limit $5/month
- **Input Validation:** Query length limits, sanitization
- **Cost Protection:** Redis caching reduces API calls by 70%
- **Monitoring:** Request logging, cost tracking

**Cost:** ~$0.01/month with normal usage

## 📊 Performance & Cost

| Metric         | Value                         |
| -------------- | ----------------------------- |
| Cache HIT      | <50ms response time           |
| Cache MISS     | ~300ms (embedding + search)   |
| Cache Hit Rate | 70% (validated in production) |
| Monthly Cost   | ~$0.01 (with caching)         |
| Rate Limit     | 10 req/10min per IP           |
| Budget Cap     | $5/month (OpenAI hard limit)  |

## ✅ Implementation Status

| Phase              | Status | Details                               |
| ------------------ | ------ | ------------------------------------- |
| Database Migration | ✅     | 50 products in Pinecone               |
| Frontend UI        | ✅     | Next.js with 5 components             |
| Search API         | ✅     | OpenAI + Pinecone integration         |
| Redis Caching      | ✅     | Vercel KV, 70% hit rate               |
| Security           | ✅     | Rate limiting, validation, monitoring |
| Deployment         | ✅     | Live on Vercel                        |
| Testing            | ✅     | 142 tests, 94%+ coverage              |

**Total Time:** 9.5 hours • **All Phases Complete**

## � Deployment (Vercel)

```bash
# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod

# Or use Vercel Dashboard:
# 1. Import repository
# 2. Add environment variables
# 3. Deploy
```

**Vercel KV Setup:**

- Dashboard → Storage → Create KV
- Environment variables auto-configured

## 💡 Usage Examples

- "comfortable running shoes"
- "basketball shoes under $150"
- "waterproof hiking boots"

## ️ Available Scripts

```bash
npm run dev                  # Dev server
npm run build                # Production build
npm run test                 # All tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests
npm run test:coverage        # With coverage
```

## 📝 License

MIT License - Feel free to fork and adapt for your portfolio!

---

## 🗂️ GitHub Organization Strategy

**This project is part of an AI Learning Portfolio Series**

### Repository Organization: **Hybrid Approach (Naming + Topics + Pinned)**

This repository follows a strategic organization pattern for managing multiple AI projects:

#### **Naming Convention:**

- `ai-product-search` - ✅ **Current Project** (Semantic search with RAG)
- `ai-chat-assistant` - 🔮 **Project #2** (Streaming chat with function calling)
- `ai-travel-agent` - 🔮 **Project #3** (Multi-agent travel planning)
- `ai-*` - Future AI projects...

#### **GitHub Topics (for this repo):**

```
ai, machine-learning, rag, semantic-search, vector-database,
pinecone, openai, embeddings, nextjs, typescript, portfolio,
full-stack, infinite-scroll, testing
```

#### **Portfolio Display:**

These projects will be **pinned** on the GitHub profile to showcase:

- 3 AI Projects (this + 2 future)
- 3 Other Best Projects

#### **Why This Strategy?**

✅ Clean separation (each project = separate repo)  
✅ Easy Vercel deployment (one repo = one deployment)  
✅ Better for portfolio (multiple impressive projects)  
✅ Topics-based filtering for recruiters  
✅ Independent version control and CI/CD

---

## 🤖 Instructions for Future AI Assistants

**If you're helping deploy Project #2 or #3, follow these steps:**

### **Pre-Deployment Checklist:**

1. **Repository Setup:**

   ```bash
   # Navigate to new project directory
   cd ai-chat-assistant  # or ai-travel-agent

   # Initialize git (if not done)
   git init
   git add -A
   git commit -m "feat: Initial commit - [Project Name] MVP"
   ```

2. **Create GitHub Repository:**

   ```bash
   # Using GitHub CLI (recommended)
   gh repo create ai-chat-assistant --public --source=. --remote=origin

   # Or manually on github.com/new
   # Repository name: ai-chat-assistant (or ai-travel-agent)
   # Description: [Clear one-liner about the project]
   # Topics: ai, openai, [project-specific topics]
   ```

3. **Push to GitHub:**

   ```bash
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to Vercel:**

   ```bash
   # Method 1: CLI (quick)
   vercel --prod

   # Method 2: Dashboard (recommended for first deploy)
   # 1. Go to vercel.com → Import Project
   # 2. Select the GitHub repository
   # 3. Add environment variables (see project's .env.local.example)
   # 4. Deploy
   ```

5. **Add Topics to GitHub:**
   - Navigate to repo on GitHub
   - Click ⚙️ next to "About"
   - Add topics: `ai`, `[project-specific]`, `nextjs`, `typescript`, `portfolio`
   - Add website URL: `https://[project-name].vercel.app`

6. **Pin Repository:**
   - Go to github.com/[username]
   - Click "Customize your pins"
   - Select this project (replace oldest pinned if needed)

7. **Update Profile README:**
   - Add project to the AI Projects section
   - Include: emoji, name, link, brief description

### **Environment Variables Pattern:**

All AI projects follow this pattern:

```bash
# OpenAI (common across all projects)
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # if using RAG

# Project-specific
PINECONE_API_KEY=...          # for RAG projects
REDIS_URL=...                 # for caching
LANGCHAIN_API_KEY=...         # for agent projects
```

### **Deployment Verification:**

After each deployment, verify:

- ✅ Site loads: `https://[project-name].vercel.app`
- ✅ API routes work (test search/chat functionality)
- ✅ Environment variables are set correctly
- ✅ No console errors in browser
- ✅ Mobile responsive (test on phone)
- ✅ GitHub repo has correct topics and description
- ✅ Vercel Analytics enabled (optional but recommended)

### **Portfolio Maintenance:**

After deploying each new AI project:

1. Update profile README with new project link
2. Ensure all 3 AI projects are pinned
3. Keep topics consistent across projects
4. Add screenshots/demos to each README
5. Cross-link related projects (if applicable)

---

## 📊 Project Series Overview

| #   | Project               | Status     | Tech Stack                   | Deploy    |
| --- | --------------------- | ---------- | ---------------------------- | --------- |
| 1   | **ai-product-search** | ✅ Live    | OpenAI + Pinecone + Next.js  | [Link](#) |
| 2   | ai-chat-assistant     | 🔮 Planned | OpenAI + Redis + Next.js     | TBD       |
| 3   | ai-travel-agent       | 🔮 Planned | LangChain + OpenAI + Next.js | TBD       |
| 4   | ai-\*                 | 🔮 Future  | TBD                          | TBD       |

**Estimated Timeline:** 1 project per 2-3 weeks (including learning + implementation + testing)

---

**Built with ❤️ using Next.js, OpenAI, Pinecone, and Redis**

_Portfolio project demonstrating production-grade AI integration, testing practices, and security implementation_
