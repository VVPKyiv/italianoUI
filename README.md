# italianoUI

Окремий frontend-репозиторій Italiano: React, TypeScript, Vite, TanStack Query.

## Розробка

```bash
npm install
npm run dev
```

UI використовує тільки відносні URL `/api/v1/...`. У production запити проходять
через gateway із сусіднього `italianoApp`.

Сторінки:

- `/` — створення реальної training session;
- `/training/:sessionId` — голосове тренування з MediaRecorder;
- `/training/:sessionId/result` — серверний результат сесії;
- `/admin/words` — керування словником і bulk JSON import.

Admin API key зберігається лише в `sessionStorage`. UI не містить hardcoded XP,
streak, історії активності або вигаданого прогресу.

## Перевірка

```bash
npm run build
```
