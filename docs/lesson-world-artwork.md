# Ілюстрації мапи уроків

Створено вбудованим інструментом `image_gen` за навичкою imagegen. Використано окремий запит на кожну локацію, без CLI чи зовнішніх зображень. Усі дев’ять фінальних ілюстрацій збережено в проєкті: `public/lesson-worlds/`. WebP 768 × 512, quality 85; разом 769 030 байтів. Зміст ілюстрацій під час оптимізації не змінювався.

| Тема | Локація | Фінальний файл |
| --- | --- | --- |
| У кафе | Затишна таверна | [tavern.webp](../public/lesson-worlds/tavern.webp) |
| У місті | Містечко пригод | [city.webp](../public/lesson-worlds/city.webp) |
| Покупки | Ринкова площа | [market.webp](../public/lesson-worlds/market.webp) |
| Знайомство | Площа знайомств | [square.webp](../public/lesson-worlds/square.webp) |
| Документи | Міська канцелярія | [archive.webp](../public/lesson-worlds/archive.webp) |
| Робота | Майстерня ремесел | [workshop.webp](../public/lesson-worlds/workshop.webp) |
| Здоров’я | Дім цілителя | [healer.webp](../public/lesson-worlds/healer.webp) |
| Досвід і плани | Вежа мандрівника | [observatory.webp](../public/lesson-worlds/observatory.webp) |
| Вибір і домовленості | Перехрестя рішень | [crossroads.webp](../public/lesson-worlds/crossroads.webp) |

## Фінальний набір промптів

Кожен промпт — спільна частина нижче та відповідний `Subject`. Параметр інструмента: `transparent_background: false`.

Для tavern, city, market:

```text
Use case: stylized-concept. Asset type: miniature location illustration for an Italian learning adventure map, dark emerald fantasy game interface. Create a beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. A SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered in the lower middle with generous breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, subtle magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish.
```

Для square, archive, workshop, healer, observatory, crossroads:

```text
Use case: stylized-concept. Asset type: miniature location illustration for an Italian learning adventure map, dark emerald fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered in lower middle with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish.
```

### tavern

```text
Subject: a beautiful welcoming two-storey fantasy Italian tavern cafe, curved terracotta roof, warm glowing arched windows, tiny outdoor table with coffee cups, hanging wooden mug-shaped sign without lettering, ivy, a little chimney and gentle smoke.
```

### city

```text
Subject: a tiny beautiful walled Italian hill town, a cluster of pastel ochre stone buildings with terracotta roofs, arched gateway and graceful clock tower, tiny cobbled street and cypress trees, inviting warm lights.
```

### market

```text
Subject: a beautiful small fantasy Italian market square with three striped cloth stalls in sage and ochre, baskets of colorful apples, bread and vegetables, cobblestones, stone fountain, glowing lanterns.
```

### square

```text
Subject: a welcoming small Italian village meeting piazza with a beautiful glowing stone fountain, two cozy benches facing each other, a pair of warm street lamps, flowering vines, one small arched pavilion and cypress trees. A place for meeting new friends.
```

### archive

```text
Subject: a beautiful little fantasy town registry and scribe's archive, an elegant compact Renaissance stone hall with a green patinated dome, arched wooden entrance, a tiny outside writing desk with parchment scrolls and a wax seal, warm windows and lanterns, vines.
```

### workshop

```text
Subject: a beautiful cozy fantasy artisan's workshop, compact timber and stone building with terracotta roof, open glowing workshop doorway with wooden workbench visible, neat outside tools and wooden crates, a little brass gear-shaped sign with no letters, warm lanterns and ivy.
```

### healer

```text
Subject: a beautiful cozy fantasy healer's stone cottage with a charming rounded terracotta roof, a little luminous green glass window, medicinal herb garden and lavender, tiny glass potion bottles displayed on an outside shelf, lantern by an arched entrance and flowering vines. Peaceful and welcoming, no medical cross.
```

### observatory

```text
Subject: a beautiful compact fantasy traveler's observatory tower of pale warm stone with a small green copper dome, a brass telescope on a little balcony, miniature star chart scroll without any writing by the doorway, an open travel chest and a cobbled garden path, warm golden windows and tiny stars overhead.
```

### crossroads

```text
Subject: a beautiful miniature fantasy crossroads with two branching cobbled paths, an elegant small arched stone bridge over a tiny stream, a little Italian travel pavilion with terracotta roof and a warm lantern, wooden direction sign with two blank arrow boards, cypress trees and flowers. Clear inviting scene representing choosing a route and making plans.
```
