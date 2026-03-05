# 🚀 Deployment Guide - AI Product Search

## Вариант A: Deploy через GitHub (рекомендуется)

### Шаг 1: Создать GitHub репозиторий

```bash
# Создать новый репозиторий на GitHub
gh repo create ai-product-search --public --source=. --remote=origin

# Или вручную на github.com:
# 1. Перейти на github.com/new
# 2. Название: ai-product-search
# 3. Public
# 4. Не создавать README (у вас уже есть)
# 5. Create repository

# Затем подключить локальный проект:
git remote add origin https://github.com/YOUR_USERNAME/ai-product-search.git
git branch -M main
git push -u origin main
```

### Шаг 2: Deploy на Vercel через Dashboard

1. **Перейти на [vercel.com](https://vercel.com)**
2. **Import Project** → выбрать GitHub
3. **Выбрать репозиторий** `ai-product-search`
4. **Configure Project:**
   - Framework Preset: Next.js (auto-detect)
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Environment Variables** (важно!):

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=ai-product-search
PINECONE_NAMESPACE=products

# Redis (Upstash) - добавить вручную или через Vercel Integration
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

6. **Deploy!** 🚀

---

## Вариант B: Deploy через Vercel CLI (быстрее)

### Шаг 1: Login в Vercel

```bash
vercel login
```

### Шаг 2: Deploy

```bash
# Первый deploy (staging)
vercel

# Production deploy
vercel --prod
```

### Шаг 3: Добавить Environment Variables

```bash
# Через CLI
vercel env add OPENAI_API_KEY
vercel env add PINECONE_API_KEY
vercel env add OPENAI_EMBEDDING_MODEL
vercel env add OPENAI_EMBEDDING_DIMENSIONS
vercel env add PINECONE_INDEX_NAME
vercel env add PINECONE_NAMESPACE

# Или через Dashboard:
# vercel.com → Settings → Environment Variables
```

### Шаг 4: Redeploy с новыми переменными

```bash
vercel --prod
```

---

## ⚡ Настройка Redis (Upstash)

### Вариант 1: Через Vercel Integration (проще)

1. **Vercel Dashboard** → ваш проект
2. **Storage** → **Create Database** → **KV**
3. Выбрать регион (ближе к пользователям)
4. Environment variables добавятся автоматически

### Вариант 2: Upstash напрямую

1. Перейти на [upstash.com](https://upstash.com)
2. **Create Database** → Redis
3. Скопировать:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Добавить в Vercel Environment Variables

---

## ✅ Проверка перед деплоем

### 1. Проверить Pinecone данные

```bash
# Убедиться, что продукты загружены
# Проверить в Pinecone Dashboard:
# https://app.pinecone.io/ → ваш index → Statistics
# Должно быть ~50 векторов
```

### 2. Проверить локальный build

```bash
npm run build
npm run start

# Открыть http://localhost:3000
# Протестировать поиск
```

### 3. Проверить Environment Variables

```bash
# .env.local должен содержать все необходимые переменные
cat .env.local

# Убедиться что .env.local в .gitignore (безопасность!)
grep -q ".env.local" .gitignore && echo "✅ .env.local ignored" || echo "❌ Add .env.local to .gitignore"
```

---

## 🔐 Security Checklist

✅ `.env.local` в `.gitignore` (не коммитить API keys!)
✅ Rate limiting настроен (10 req/10min)
✅ OpenAI budget cap установлен ($5/month)
✅ Input validation работает
✅ Только необходимые переменные в production

---

## 📊 Post-Deploy Checklist

После деплоя проверить:

1. ✅ **Сайт открывается:** `https://your-project.vercel.app`
2. ✅ **Поиск работает:** Попробовать "running shoes"
3. ✅ **Фильтры работают:** Выбрать бренд/цену
4. ✅ **Изображения загружаются:** Unsplash images
5. ✅ **Кэш работает:** Повторный поиск <50ms
6. ✅ **Mobile responsive:** Открыть на телефоне
7. ✅ **Analytics:** Vercel Analytics включены

---

## 🐛 Troubleshooting

### Ошибка: "OPENAI_API_KEY is not set"

**Решение:**

```bash
# Добавить в Vercel Environment Variables
vercel env add OPENAI_API_KEY production
```

### Ошибка: "Pinecone index not found"

**Решение:**

- Проверить `PINECONE_INDEX_NAME` совпадает с именем в Dashboard
- Убедиться что index существует и содержит данные

### Ошибка: Rate limit 429

**Решение:**

- Проверить OpenAI usage: https://platform.openai.com/usage
- Увеличить budget cap если нужно
- Redis cache должен снизить количество запросов

### Build Failed

**Решение:**

```bash
# Проверить локально
npm run build

# Посмотреть логи в Vercel
vercel logs
```

---

## 📱 Custom Domain (опционально)

```bash
# Добавить через CLI
vercel domains add your-domain.com

# Или в Dashboard:
# Settings → Domains → Add
# Настроить DNS у вашего регистратора
```

---

## 📈 Monitoring & Analytics

### Vercel Analytics (бесплатно)

```bash
# Включить в Dashboard:
# Analytics → Enable
```

### Cost Tracking

**OpenAI:**

- Dashboard: https://platform.openai.com/usage
- Установить alerts при $2, $3, $4

**Pinecone:**

- Dashboard: https://app.pinecone.io/
- Free tier: 1GB, достаточно для 50-100 продуктов

**Redis:**

- Vercel KV Dashboard
- Free tier: 30MB, достаточно для кэша

**Ожидаемые затраты:**

- OpenAI: $0.01-$0.05/месяц (с кэшем 70%)
- Pinecone: $0 (Free tier)
- Redis: $0 (Free tier)
- Vercel: $0 (Hobby plan)

**Итого: ~$0-$0.05/месяц** 💰

---

## 🎯 Next Steps

После успешного деплоя:

1. ✅ Добавить live demo link в README.md
2. ✅ Создать screenshots для portfolio
3. ✅ Обновить LinkedIn (AI Product Search project)
4. ✅ Добавить в resume
5. ✅ Написать case study (tech decisions, metrics)

---

## 💡 Pro Tips

**Auto-deploy при git push:**

- После первого deploy через GitHub, каждый `git push` автоматически деплоит
- main branch → production
- другие branches → preview deployments

**Preview Deployments:**

- Каждый PR получает свой preview URL
- Можно тестировать changes перед merge

**Environment Variables per Environment:**

```bash
# Development
vercel env add SECRET development

# Preview
vercel env add SECRET preview

# Production
vercel env add SECRET production
```

**Vercel CLI полезные команды:**

```bash
vercel logs                 # Посмотреть логи
vercel ls                   # Список deployments
vercel inspect             # Детали последнего deploy
vercel env ls              # Список env variables
vercel domains ls          # Список доменов
```

---

## 📞 Поддержка

**Документация:**

- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs/deployment
- Pinecone: https://docs.pinecone.io

**Community:**

- Vercel Discord: https://vercel.com/discord
- Next.js Discussions: https://github.com/vercel/next.js/discussions

---

**Удачи с деплоем! 🚀**
