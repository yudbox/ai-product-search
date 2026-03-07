# 🚀 Quick Start: CI/CD Setup

## Шаг 1: Настроить GitHub Actions (уже сделано ✅)

Workflow файл создан: `.github/workflows/ci.yml`

**Что проверяет:**
- ✅ Код качество (ESLint)
- ✅ Типы (TypeScript)
- ✅ Unit тесты (268 tests)
- ✅ Integration тесты (60 tests)
- ✅ Build приложения

## Шаг 2: Подключить Vercel к GitHub

### Через Vercel Dashboard:

1. Перейти на [vercel.com](https://vercel.com/new)
2. Click **"Import Project"**
3. Выбрать GitHub repository: `ai-product-search`
4. **Framework Preset:** Next.js (auto-detected)
5. **Root Directory:** `./`
6. **Build Command:** `npm run build`
7. **Output Directory:** `.next`

### Добавить Environment Variables:

```env
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
PINECONE_INDEX_NAME=ai-product-search
PINECONE_NAMESPACE=products
```

8. Click **"Deploy"** 🚀

## Шаг 3: Настроить Branch Protection

**GitHub → Settings → Branches → Add rule for `main`:**

```
Branch name pattern: main

✅ Require a pull request before merging
   └─ Require approvals: 1

✅ Require status checks to pass before merging
   ├─ quality-checks
   └─ build

✅ Require branches to be up to date before merging
```

## Шаг 4: Первый Deploy

```bash
# 1. Создать feature branch
git checkout -b feature/initial-setup

# 2. Сделать commit
git add .
git commit -m "ci: add GitHub Actions workflow"

# 3. Push и создать PR
git push origin feature/initial-setup
gh pr create --title "CI/CD Setup" --body "Initial CI/CD configuration"

# 4. Проверить что все checks прошли ✅
gh pr checks

# 5. Merge PR
gh pr merge --merge
```

**Результат:**
- ✅ GitHub Actions проверит код
- 🚀 Vercel автоматически задеплоит на production
- 🌐 Приложение доступно на `https://your-app.vercel.app`

## Проверка перед деплоем

```bash
# Запустить все проверки локально
./check-deploy-ready.sh

# Или вручную:
npm run lint
npm run type-check
npm run test
npm run build
```

## Workflow для разработки

### Создание новой фичи:

```bash
# 1. Создать branch от main
git checkout main
git pull
git checkout -b feature/new-feature

# 2. Разработка + тесты
npm run dev
npm run test:watch

# 3. Commit changes
git add .
git commit -m "feat: add new feature"

# 4. Push и создать PR
git push origin feature/new-feature
gh pr create

# 5. GitHub Actions автоматически:
#    ✓ Проверяет код
#    ✓ Запускает тесты
#    ✓ Создает preview в Vercel

# 6. После review - мерж
gh pr merge

# 7. Vercel автоматически деплоит на production 🚀
```

### Preview Deployments:

Каждый PR получает уникальный preview URL:
```
https://ai-product-search-pr-123.vercel.app
```

Vercel автоматически комментирует в PR с ссылкой.

## Мониторинг

### Vercel Dashboard:
- 📊 **Analytics:** Traffic, performance
- 🐛 **Logs:** Runtime errors
- 📈 **Deployments:** История деплоев

### GitHub Actions:
- ✅ **Actions tab:** Все workflow runs
- 📊 **Status badges:** В README
- 🔔 **Notifications:** Email при fail

## Rollback (откат)

Если что-то пошло не так:

### Vercel Dashboard:
1. **Deployments** → выбрать предыдущий successful deployment
2. Click **"⋯"** → **"Promote to Production"**
3. ⚡ Instant rollback

### Git:
```bash
git revert <bad-commit>
git push origin main
# Vercel автоматически задеплоит revert
```

## Troubleshooting

### GitHub Actions fail:

```bash
# Проверить локально
npm run lint
npm run type-check
npm run test

# Посмотреть логи
gh pr checks
gh run view <run-id>
```

### Vercel deploy fail:

```bash
# Проверить логи в Vercel Dashboard
# Или через CLI:
vercel logs

# Проверить env variables
vercel env ls
```

## Полезные команды

```bash
# GitHub
gh pr list                 # Список PR
gh pr checks              # Статус checks
gh pr view --web          # Открыть PR в браузере

# Vercel
vercel                    # Preview deploy
vercel --prod             # Production deploy
vercel logs               # View logs
vercel domains            # Manage domains
```

## Документация

Подробная документация:
- 📄 [CI_CD_STRATEGY.md](./CI_CD_STRATEGY.md) - Полная стратегия CI/CD
- 📄 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Гайд по деплою
- 📄 [README.md](./README.md) - Основная документация

## Support

Вопросы? Проблемы?
- GitHub Issues
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
