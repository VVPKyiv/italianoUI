# Ілюстрації бібліотеки читання

Це перша версія. Поточний набір сюжетних ілюстрацій і промптів описано в [reading-story-artwork-v2.md](reading-story-artwork-v2.md). Попередні файли збережено.

Шість нових діорам створено вбудованим `image_gen` за навичкою imagegen. Кожна має окремий промпт. Фінальні WebP 768 × 512, quality 85 збережено у `public/reading-worlds/`; зміст під час оптимізації не змінювався.

- [family.webp](../public/reading-worlds/family.webp)
- [home.webp](../public/reading-worlds/home.webp)
- [harbor.webp](../public/reading-worlds/harbor.webp)
- [windmill.webp](../public/reading-worlds/windmill.webp)
- [academy.webp](../public/reading-worlds/academy.webp)
- [garden.webp](../public/reading-worlds/garden.webp)

Відповідність ілюстрацій темам: `src/content/readingArtwork.ts`. Площа, таверна, місто, дім цілителя, перехрестя, ринок, майстерня й канцелярія повторно використовуються з `public/lesson-worlds/`. Їхні промпти — у [lesson-world-artwork.md](lesson-world-artwork.md).

## Фінальні промпти

Інструмент: вбудований `image_gen`, `transparent_background: false`.

### family

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful intimate Italian family courtyard between two small cozy stone homes, glowing windows, a little table set for a family meal with four different chairs, a small wooden rocking horse and flowering vines, one lemon tree and warm lanterns. Focus on a welcoming shared courtyard rather than a large building.
```

### home

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful single small fantasy Italian cottage, ochre plaster and timber, gently curved terracotta roof with chimney, green shutters, welcoming glowing round window, a miniature front garden with flowers and a little stone staircase, a warm lamp by the wooden doorway.
```

### harbor

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful miniature Italian fantasy harbor with a short stone pier, tiny elegant sailboat moored beside it, compact warm-lit harbor master's building with terracotta roof, small lighthouse, miniature travel trunks on the pier, teal water contained within the oval stone diorama base.
```

### windmill

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful compact fantasy Italian stone windmill with wooden sails, terracotta roof and glowing windows on a tiny grassy hill. One spring flowering tree, a golden autumn tree, small patches of snow on the far side, and one soft little rain cloud with a warm ray of sun. Clearly represent changing weather and seasons within a single harmonious miniature, not a divided four-panel illustration.
```

### academy

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful compact fantasy Italian academy and library, Renaissance stone school with terracotta roof and a small green copper turret, glowing arched windows and an open doorway. An open book resting on an outdoor reading desk, a small stack of books and a brass lamp, flowering vines and a small cypress. No written symbols anywhere.
```

### garden

```text
Use case: stylized-concept. Asset type: miniature illustration for themed reading cards in an Italian learning fantasy game interface. Beautiful polished stylized 3D diorama, handcrafted fantasy RPG environment, charming Italian Renaissance architecture with terracotta roofs and carved timber, tactile stone and moss, amber lanterns, soft cinematic lighting, premium game art, readable at small thumbnail size. Landscape 3:2 composition. SINGLE compact miniature scene on an oval mossy stone base, viewed from slightly above, centered with breathing room. Entire structure fully in frame. Deep nearly black forest green background #0d1914 with subtle atmospheric haze, warm luminous windows, magical fireflies. No text, lettering, UI, frame, border, people, logo or watermark. Strong silhouette, restrained detail, enchanting rather than childish. Subject: a beautiful miniature fantasy Italian community garden and city park, a small elegant glass conservatory with green copper frame, a stone fountain, lush trees, flower beds and a neat little wooden footbridge over a clean stream, a tiny terracotta roofed pavilion and warm lamps. Peaceful green urban nature, strong simple silhouette.
```
