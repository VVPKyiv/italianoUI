# italianoUI

React/Vite інтерфейс Italiano: TypeScript і TanStack Query.

```sh
npm install
npm run dev
npm run build
```

Усі запити використовують відносні `/api/v1/...`. У production їх маршрутизує
сусідній `italianoApp` через gateway. Для окремого dev backend можна задати
`ITALIANO_API_PROXY=http://127.0.0.1:18085` перед запуском Vite.

Основні маршрути:

- `/` — вільні тренування та рекомендований наступний крок;
- `/learn` — блоки й опубліковані уроки з БД;
- `/learn/sessions/:id` — проходження уроку та його результат;
- `/progress` — прогрес тренувань;
- `/reading` — бібліотека читання;
- `/vocabulary` — словник;
- `/multiplayer` — створення кімнати та приєднання до спільної гри;
- `/join?code=…` — сумісність із QR-запрошеннями: перехід до вкладки приєднання;
- `/admin/words` — керування словами й аудіо;
- `/admin/curriculum` — блоки, чернетки, публікація версій і нові аудіоматеріали.

Admin key зберігається лише в `sessionStorage`. Редактор використовує
захищений API; чернетки не віддаються learner API. Метадані уроку редагуються
формами, кроки — JSON за схемою. Додавання уроку не потребує зміни React-коду.
Подробиці: `../italianoApp/docs/curriculum.md`.

Правила інтерфейсу та результати дизайн-рев’ю: [DESIGN_REVIEW.md](./DESIGN_REVIEW.md).
Спільні візуальні правила зібрані в `src/styles/interface.css`.
