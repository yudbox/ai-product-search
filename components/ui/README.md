# UI Components Library

Переиспользуемая библиотека UI компонентов для проекта AI Product Search.

## Компоненты

### Button

Универсальная кнопка с разными вариантами и размерами.

**Props:**

- `variant?`: `"primary" | "secondary" | "ghost"` (по умолчанию: `"primary"`)
- `size?`: `"sm" | "md" | "lg"` (по умолчанию: `"md"`)
- Все стандартные HTML атрибуты `<button>`

**Примеры использования:**

```tsx
import { Button } from "@/components/ui/Button";

// Primary button (по умолчанию)
<Button onClick={handleClick}>Click me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Ghost button (прозрачный)
<Button variant="ghost" size="sm">Clear all</Button>

// Large primary button
<Button variant="primary" size="lg" disabled={loading}>
  Search
</Button>
```

### Input

Текстовое поле ввода с поддержкой ошибок.

**Props:**

- `error?`: `string` - текст ошибки для отображения
- Все стандартные HTML атрибуты `<input>`

**Примеры использования:**

```tsx
import { Input } from "@/components/ui/Input";

// Базовое использование
<Input
  type="text"
  placeholder="Search for shoes..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>

// С ошибкой
<Input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Please enter a valid email"
/>

// С autoFocus
<Input
  type="text"
  autoFocus
  placeholder="Start typing..."
/>
```

### Checkbox

Чекбокс с опциональным лейблом.

**Props:**

- `label?`: `ReactNode` - текст или элемент для отображения рядом с чекбоксом
- Все стандартные HTML атрибуты `<input type="checkbox">`

**Примеры использования:**

```tsx
import { Checkbox } from "@/components/ui/Checkbox";

// С лейблом
<Checkbox
  label="Remember me"
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// Без лейбла (только чекбокс)
<Checkbox
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// С кастомным лейблом
<Checkbox
  label={<span className="font-bold">Nike</span>}
  checked={filters.brands.includes("Nike")}
  onChange={() => toggleBrand("Nike")}
/>
```

## Импорт

Можно импортировать компоненты отдельно или все сразу:

```tsx
// Отдельно
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

// Или все вместе
import { Button, Input, Checkbox } from "@/components/ui";
```

## Стилизация

Все компоненты используют utility-функцию `cn()` для объединения Tailwind классов, что позволяет переопределять стили через prop `className`:

```tsx
<Button className="w-full mt-4" variant="primary">
  Submit
</Button>
```

## Зависимости

- `clsx` - для условных классов
- `tailwind-merge` - для правильного объединения Tailwind классов
- `@/lib/utils` - утилита `cn()` для объединения классов
