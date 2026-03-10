# Redis Client Architecture

## 🏗️ Clean Architecture with Dependency Injection

Новая модульная структура Redis клиента с применением SOLID принципов.

## 📁 Структура

```
lib/redis/
├── client.ts              # Interface (IRedisClient)
├── dockerRedisClient.ts   # Docker Redis implementation
├── vercelKvClient.ts      # Vercel KV implementation
└── index.ts               # Factory + DI + business logic
```

---

## 🎯 Принципы

### 1. **Interface Segregation** (SOLID - I)

```typescript
// client.ts - абстракция
export interface IRedisClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
  zincrby(
    key: string,
    increment: number,
    member: string,
  ): Promise<string | number>;
  // ... другие методы
}
```

### 2. **Dependency Inversion** (SOLID - D)

```typescript
// index.ts - Factory Pattern
function createRedisClient(): IRedisClient {
  const useVercelKV = process.env.KV_REST_API_URL || isProduction;

  if (useVercelKV) {
    return new VercelKvClient(); // ✅ Инжектим Vercel KV
  } else {
    return new DockerRedisClient(); // ✅ Инжектим Docker Redis
  }
}

export const redis: IRedisClient = createRedisClient();
```

### 3. **Single Responsibility** (SOLID - S)

- `client.ts` - только interface
- `dockerRedisClient.ts` - только Docker Redis логика
- `vercelKvClient.ts` - только Vercel KV логика
- `index.ts` - только Factory + business logic (TTL, frequency tracking)

### 4. **Open/Closed** (SOLID - O)

Легко добавить новую реализацию (например, AWS ElastiCache):

```typescript
// lib/redis/awsRedisClient.ts
export class AwsRedisClient implements IRedisClient {
  // ... implementation
}

// lib/redis/index.ts
function createRedisClient(): IRedisClient {
  if (useAWS) return new AwsRedisClient();
  if (useVercelKV) return new VercelKvClient();
  return new DockerRedisClient();
}
```

---

## 🔌 Использование

### В коде приложения:

```typescript
import { redis, CACHE_PREFIXES, getAdaptiveTTL } from "@/lib/redis";

// Используем абстракцию - не знаем, Docker это или Vercel KV!
const cached = await redis.get<string>(`${CACHE_PREFIXES.L1}${key}`);
await redis.set(`${CACHE_PREFIXES.L1}${key}`, value, { ex: ttl });

// Business logic методы
const ttl = await getAdaptiveTTL(key);
await trackQueryFrequency(key);

// Для мониторинга используйте RedisInsight
// https://redis.com/redis-enterprise/redis-insight/
```

---

## 🐳 Локальная разработка (Docker Redis)

```bash
# 1. Запустить Redis
docker-compose up -d

# 2. .env.local
REDIS_URL=redis://localhost:6379
# НЕ указывать KV_REST_API_URL

# 3. Запуск
npm run dev

# Console output:
# 🔌 Redis Backend: Docker Redis
# 🐳 Connecting to Docker Redis: redis://localhost:6379
# ✅ Docker Redis connected
```

**Что происходит:**

```typescript
// Factory видит: нет KV_REST_API_URL → выбирает DockerRedisClient
const redis: IRedisClient = new DockerRedisClient();
```

---

## ☁️ Production (Vercel KV)

```bash
# Vercel Dashboard:
# Storage → Create KV Database → Connect to Project

# Env variables (автоматически):
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...

# Deploy:
git push

# Console output (в Vercel logs):
# 🔌 Redis Backend: Vercel KV
# ☁️ Using Vercel KV (Upstash REST API)
```

**Что происходит:**

```typescript
// Factory видит: есть KV_REST_API_URL → выбирает VercelKvClient
const redis: IRedisClient = new VercelKvClient();
```

---

## ✅ Преимущества новой архитектуры

### 1. **Чистый код**

```typescript
// ❌ Старый подход (монолитный файл 250+ строк):
export const kv = useVercelKV ? vercelKv : createAdapter();

// ✅ Новый подход (модульный):
export const redis: IRedisClient = createRedisClient();
```

### 2. **Легкое тестирование**

```typescript
// Можно легко создать mock:
class MockRedisClient implements IRedisClient {
  private data = new Map();
  async get<T>(key: string) {
    return this.data.get(key) || null;
  }
  async set(key: string, value: unknown) {
    this.data.set(key, value);
  }
  // ... остальные методы
}

// В тестах:
const mockRedis = new MockRedisClient();
// Инжектим mock вместо реального клиента
```

### 3. **Separation of Concerns**

```
client.ts           → Contract (interface)
dockerRedisClient.ts → Implementation 1 (ioredis)
vercelKvClient.ts    → Implementation 2 (@vercel/kv)
index.ts            → Factory + Business Logic
```

### 4. **Type Safety**

```typescript
// Все реализации обязаны соответствовать интерфейсу
class MyClient implements IRedisClient {
  // TypeScript заставит реализовать ВСЕ методы из IRedisClient
}
```

### 5. **Расширяемость**

Добавление AWS ElastiCache:

1. Создать `awsRedisClient.ts` (implements IRedisClient)
2. Добавить условие в Factory (`if (useAWS) return new AwsRedisClient()`)
3. Готово! ❌ Не нужно менять остальной код

---

## 🔄 Миграция с старого подхода

### Было:

```typescript
import { kv } from "@/lib/redis";
await kv.get(key);
```

### Стало:

```typescript
import { redis } from "@/lib/redis";
await redis.get(key);
```

**Изменение:** `kv` → `redis` (+ более чистая архитектура)

---

## 📊 Сравнение

| Метрика                      | Старый подход    | Новый подход             |
| ---------------------------- | ---------------- | ------------------------ |
| **Строк кода в одном файле** | 250+             | ~50-80 на файл           |
| **Модули**                   | 1 монолит        | 4 модуля                 |
| **Тестируемость**            | Сложно (монолит) | Легко (мокать interface) |
| **Расширяемость**            | Тяжело           | Легко (новый класс)      |
| **SOLID**                    | ❌               | ✅                       |
| **Dependency Injection**     | ❌               | ✅                       |

---

## 🎓 Для портфолио / интервью

**Можете говорить:**

- ✅ "Применил Clean Architecture с Dependency Injection"
- ✅ "Использовал SOLID принципы (Interface Segregation, Dependency Inversion)"
- ✅ "Реализовал Factory Pattern для автоматического выбора backend"
- ✅ "Разделил concerns: interface, implementations, business logic"
- ✅ "Код легко тестируется через mock implementations"

**Это впечатляет работодателей!** 🚀
