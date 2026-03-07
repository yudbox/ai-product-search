# 🚀 CI/CD Strategy - GitHub Actions + Vercel

## 📊 Архитектура деплоя

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    git push / create PR
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS (CI Pipeline)                    │
│                                                              │
│  Job 1: quality-checks (~2-3 min)                           │
│  ✓ Lint code (ESLint)                                       │
│  ✓ Type checking (TypeScript)                               │
│  ✓ Run unit tests (268 tests)                               │
│  ✓ Run integration tests (60 tests)                         │
│  ✓ Generate coverage report                                 │
│                                                              │
│  Job 2: build (~1-2 min)                                     │
│  ✓ Build Next.js application                                │
│  ✓ Upload build artifacts                                   │
│                                                              │
│  Job 3: summary                                              │
│  ✓ Display results                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    (если все ✅ passed)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VERCEL (CD Pipeline)                            │
│                                                              │
│  Automatic triggers:                                         │
│  • PR created → Preview Deployment                          │
│  • Push to main → Production Deployment                     │
│                                                              │
│  Vercel процесс:                                             │
│  1. Clone repository                                         │
│  2. Install dependencies                                     │
│  3. Build Next.js (npm run build)                            │
│  4. Deploy to Edge Network                                   │
│  5. Update DNS / Generate URL                                │
│                                                              │
│  Results:                                                    │
│  • PR: https://ai-product-search-pr-123.vercel.app          │
│  • Production: https://ai-product-search.vercel.app         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Процесс после мержа в main

### Шаг 1: GitHub Actions запускается автоматически

**Триггер:** `git push origin main` или мерж PR в main

```bash
# Разработчик
git checkout main
git merge feature/new-feature
git push origin main
```

**GitHub Actions начинает выполнение:**

```
⏱️  00:00 - Starting workflow
⏱️  00:10 - Installing dependencies (npm ci)
⏱️  00:45 - Running ESLint
⏱️  01:00 - Type checking TypeScript
⏱️  01:30 - Running unit tests (268 tests)
⏱️  02:00 - Running integration tests (60 tests)
⏱️  02:30 - Building Next.js app
⏱️  03:00 - ✅ All checks passed!
```

### Шаг 2: Vercel получает webhook от GitHub

**Vercel автоматически определяет:**
- ✅ Commit в main branch
- ✅ GitHub Actions прошел успешно
- 🚀 Начинает production deployment

**Vercel процесс:**

```
⏱️  00:00 - Cloning repository from GitHub
⏱️  00:15 - Installing dependencies
⏱️  00:45 - Building Next.js application
         • Generating static pages
         • Optimizing images
         • Creating production bundle
⏱️  02:00 - Deploying to Vercel Edge Network
         • Распределение по CDN узлам
         • Обновление DNS records
⏱️  02:30 - ✅ Deployment successful!
         🌐 https://ai-product-search.vercel.app
```

### Шаг 3: Vercel уведомления

**Уведомления отправляются:**
- 📧 Email (если настроено)
- 💬 Slack/Discord (если настроено)
- 🔔 GitHub Status Check (✅ Deployment ready)

**Результат:**
- ✅ Новая версия доступна на production
- 🔄 Старая версия доступна для отката
- 📊 Deployment logs сохранены

---

## 🔗 Взаимодействие GitHub Actions ↔ Vercel

### Вариант 1: Последовательная проверка (рекомендуется)

```
GitHub Actions (проверка)  →  Vercel (деплой)
        ↓
    Проходит?
    ├─ ✅ Да  → Vercel деплоит
    └─ ❌ Нет → Vercel НЕ деплоит
```

**Настройка:** В Vercel → Settings → Git → Production Branch
- ✅ Enable "Wait for status checks before deploying"
- ✅ Required checks: `quality-checks`, `build`

### Вариант 2: Параллельная проверка (текущая)

```
GitHub Actions  →  Проверяет качество кода
Vercel         →  Деплоит параллельно
```

**Плюсы:**
- ⚡ Быстрее (деплой не зависит от тестов)
- 🔄 Всегда можно откатить

**Минусы:**
- ⚠️ Может задеплоить broken code

---

## 📦 Environment Variables

### GitHub Actions Secrets

Добавить в GitHub → Settings → Secrets and variables → Actions:

```
OPENAI_API_KEY          # Для тестов (опционально)
PINECONE_API_KEY        # Для тестов (опционально)
CODECOV_TOKEN           # Для coverage reports (опционально)
```

### Vercel Environment Variables

**Automatically synced from Vercel dashboard:**

```env
# Production
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
PINECONE_INDEX_NAME=ai-product-search
PINECONE_NAMESPACE=products

# Redis (Vercel KV)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

---

## 🎯 Workflow сценарии

### Сценарий 1: Создание PR

```bash
git checkout -b feature/new-search-filter
# ... делаем изменения
git commit -m "feat: add price range filter"
git push origin feature/new-search-filter
```

**Что происходит:**

1. **GitHub Actions запускается**
   - ✅ Lint checks
   - ✅ Type checks
   - ✅ All tests pass
   - Status: ✅ All checks have passed

2. **Vercel создает preview**
   - 🔗 https://ai-product-search-pr-456.vercel.app
   - 💬 Comment в PR с preview link
   - 🔄 Обновляется при каждом push

3. **Результат:**
   - Reviewer может протестировать изменения
   - Без влияния на production

### Сценарий 2: Мерж PR в main

```bash
# На GitHub: Click "Merge pull request"
# или через CLI:
gh pr merge 456 --merge
```

**Что происходит:**

1. **GitHub Actions (final check)**
   - ⚡ Быстрая проверка на main branch
   - ✅ Все тесты прошли → разрешить деплой

2. **Vercel production deployment**
   - 🏗️ Build application
   - 🚀 Deploy to production
   - 🌐 Update https://ai-product-search.vercel.app
   - ⏱️ ~2-3 минуты

3. **Уведомления:**
   - ✅ Deployment successful
   - 📊 Build logs available
   - 🔗 Production link updated

### Сценарий 3: Hotfix

```bash
git checkout main
git pull
git checkout -b hotfix/critical-bug
# ... fix bug
git commit -m "fix: correct search query parsing"
git push origin hotfix/critical-bug

# Fast-track merge:
gh pr create --title "Hotfix: critical bug" --body "Urgent fix"
gh pr merge --merge --auto
```

**Что происходит:**

1. **GitHub Actions (ускоренная проверка)**
   - ⚡ Только критичные тесты
   - ⏱️ ~2 минуты вместо 4

2. **Vercel (приоритетный деплой)**
   - 🚨 Priority build queue
   - ⚡ Быстрый deploy (~1-2 минуты)

---

## 🔧 Конфигурация Vercel

### Deploy Hooks

**Создать webhook для manual trigger:**

1. Vercel Dashboard → Settings → Git → Deploy Hooks
2. Create Hook: `manual-deploy-main`
3. Copy URL

**Использование:**

```bash
# Trigger deploy без push
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

### Ignored Build Step

**vercel.json (опционально):**

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  },
  "github": {
    "silent": false,
    "autoAlias": true,
    "autoJobCancelation": true
  }
}
```

---

## 📊 Monitoring & Rollback

### Monitoring в Vercel

**Доступ к метрикам:**
- 📈 Vercel Analytics: Real-time traffic
- 🐛 Error tracking: Runtime errors
- ⚡ Performance: Core Web Vitals
- 📊 Function logs: API routes

### Rollback (откат)

**Если production сломался:**

1. **Через Vercel Dashboard:**
   - Deployments → Previous deployment
   - Click "..." → Promote to Production
   - ⏱️ Instant rollback

2. **Через CLI:**
   ```bash
   vercel rollback
   ```

3. **Через Git:**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Vercel автоматически задеплоит предыдущую версию
   ```

---

## ✅ Best Practices

### 1. Branch Protection Rules

**GitHub → Settings → Branches → main:**

```
✅ Require pull request reviews (1 approver)
✅ Require status checks to pass before merging
  ├─ quality-checks
  └─ build
✅ Require branches to be up to date
✅ Include administrators
```

### 2. Deployment Strategy

**Рекомендуется:**
- 🔒 Protected main branch
- 📝 All changes через PR
- ✅ Required CI checks
- 🚀 Automatic production deploy при мерже
- 🔄 Preview deployments для всех PR

### 3. Testing Strategy

**Layers:**
1. **Local:** `npm test` перед commit
2. **CI:** Все тесты при push/PR
3. **Vercel:** Preview deployment для QA
4. **Production:** Automatic monitoring

---

## 📚 Useful Commands

```bash
# Локальная проверка перед push
npm run lint
npm run type-check
npm test
npm run build

# GitHub CLI
gh pr create               # Создать PR
gh pr checks               # Посмотреть статус checks
gh pr merge --auto         # Auto-merge когда checks pass

# Vercel CLI
vercel                     # Preview deployment
vercel --prod              # Production deployment
vercel logs               # View deployment logs
vercel rollback           # Rollback to previous
```

---

## 🎓 Summary

**После мержа в main:**

1. ⚡ **GitHub Actions (3-4 мин):**
   - Проверяет код качество
   - Прогоняет 328 тестов
   - Строит приложение

2. 🚀 **Vercel (2-3 мин):**
   - Клонирует код с GitHub
   - Строит Next.js приложение
   - Деплоит на global CDN
   - Обновляет production URL

3. ✅ **Результат:**
   - Новая версия live на production
   - Все метрики доступны в реальном времени
   - Возможность instant rollback
   - Preview deployments для будущих PR

**Total time: ~5-7 минут от мержа до production 🚀**
