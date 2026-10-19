# Бібліотека читання — сюжетні ілюстрації v2

12 нових ілюстрацій створено вбудованим `image_gen` за навичкою imagegen. Фінальні WebP 900 × 600, quality 86, збережено в `public/reading-worlds/story-v2/`. Попередні файли збережено. Оптимізація змінила лише розмір і кодування, не зміст.

| Тема | Файл |
| --- | --- |
| Люди й родина | [family.webp](../public/reading-worlds/story-v2/family.webp) |
| Щоденне спілкування | [conversation.webp](../public/reading-worlds/story-v2/conversation.webp) |
| Дім | [home.webp](../public/reading-worlds/story-v2/home.webp) |
| Їжа й напої | [food.webp](../public/reading-worlds/story-v2/food.webp) |
| Транспорт і подорожі | [transport.webp](../public/reading-worlds/story-v2/transport.webp) |
| Навчання й мова | [study.webp](../public/reading-worlds/story-v2/study.webp) |
| Здоров’я | [health.webp](../public/reading-worlds/story-v2/health.webp) |
| Покупки й гроші | [shopping.webp](../public/reading-worlds/story-v2/shopping.webp) |
| Курси й освіта | [education.webp](../public/reading-worlds/story-v2/education.webp) |
| Ситуації в подорожі | [travel.webp](../public/reading-worlds/story-v2/travel.webp) |
| Робоче життя | [work.webp](../public/reading-worlds/story-v2/work.webp) |
| Документи й установи | [documents.webp](../public/reading-worlds/story-v2/documents.webp) |

Переглянуто всі 15 тем. Для погоди, міста й довкілля збережено відповідні сцени млина з порами року, міста й саду. Вони показуються більшими без обрізання. Для невідомих нових тем використовується попередня ілюстрація академії. Відповідність: `src/content/readingArtwork.ts`.

Родинна сцена використовує Дріззта, Бруенора та маленьку Кетті-Брі за запитом користувача. Інші сюжети передають розмову, трапезу, читання, роботу, допомогу та практичні дії. Це творчі ілюстрації тем; навчальні тексти не змінювалися.

## Фінальні промпти

Інструмент: вбудований `image_gen`, `transparent_background: false`.

### family

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a warm chosen-family portrait of R. A. Salvatore's characters Drizzt Do'Urden, Bruenor Battlehammer and little Catti-brie aged about eight, sitting close together at home by a glowing hearth. Drizzt is a kind adult dark elf with deep charcoal skin, long white hair, pointed ears, lavender eyes and a green cloak. Bruenor is a broad stout dwarf with a big vivid copper-red beard, practical leather clothing, guardian-like warmth. Catti-brie is a small auburn-haired human girl in modest simple blue tunic. Bruenor is telling a story while Catti-brie holds a carved wooden toy panther and leans against him, Drizzt smiles beside them. Strong visible caring family connection, three prominent upper-body figures, gentle and wholesome, no fighting or drawn weapons.
```

### conversation

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: Drizzt Do'Urden, an adult charcoal-skinned dark elf with long white hair, pointed ears, lavender eyes and a green travel cloak, having a friendly face-to-face conversation with a smiling red-bearded dwarf merchant beside a warm village lantern. Their open hand gestures and expressive faces clearly communicate greeting and everyday talk. Medium close view of two people facing each other, a cozy Italian-inspired cobbled lane softly blurred behind them, no speech bubbles or text.
```

### home

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a beautiful cozy fantasy home interior seen through an open arched wooden doorway, a large inviting armchair, glowing stone fireplace, small table with a teapot, shelves of personal keepsakes, soft woven rug and a sleeping black panther curled on the rug. Focus on a readable intimate lived-in room rather than a building exterior; strong warm light, foreground furniture large, no people.
```

### food

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a close inviting fantasy tavern meal shared by Bruenor Battlehammer, a stout copper-red-bearded dwarf, and adult Drizzt Do'Urden, a charcoal-skinned white-haired dark elf in green. A generous wooden table in the foreground holds warm bread, a bowl of vegetable soup, red apples, a cheese wedge and ceramic mugs of tea. The food is prominent and clear, the two friendly companions visible chest-up enjoying conversation, warm hearth background, no alcohol focus, no fighting.
```

### transport

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a cheerful fantasy journey in a large wooden horse-drawn travel wagon, with adult Drizzt Do'Urden, a charcoal-skinned white-haired dark elf in a green cloak, and a copper-red-bearded dwarf companion riding in the front. The big wooden wheel, horse harness, stacked travel trunks and wagon are the main readable subjects. A stone bridge and green hills softly in the background, medium close composition showing travelers and vehicle, no battle.
```

### study

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: little Catti-brie, an auburn-haired human girl aged about eight in a modest blue tunic, learning to read with adult Drizzt Do'Urden, a gentle charcoal-skinned white-haired dark elf with pointed ears and green cloak. Both are seated at a wooden desk, a large open illustrated book in front of them, Drizzt points to a picture while she follows with a wooden reading pointer. Prominent faces, book and hands, warm library lamplight, no readable lettering or writing in the book.
```

### health

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a kind fantasy village healer in sage green robes gently wrapping a clean linen bandage around the wrist of a seated sturdy red-bearded dwarf traveler. A bowl of herbs, folded bandages and a small closed medicine pouch on the foreground table. Friendly calm reassuring expressions, large visible upper-body people and hands, warm infirmary interior, no blood, no injury detail, no needles, no text.
```

### shopping

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: adult Drizzt Do'Urden, a charcoal-skinned white-haired dark elf in a green cloak, buying a small basket of apples and bread from a smiling human market vendor. A few large copper coins exchange hands prominently in the center, bright produce baskets in foreground, friendly faces visible above the stall, a sage striped awning and soft warm village market background. Clearly show shopping and payment, medium close composition, no numbers or labels.
```

### education

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a small friendly fantasy classroom inside a magical academy: a wise elderly human tutor in simple deep teal robes teaches two attentive young adult students, one human and one elf. A large open atlas, an abacus and a gently glowing small globe on the central table, books in the soft background. Focus on the tutor's clear teaching gesture and students learning together, visible faces and educational objects, no readable writing, no blackboard letters.
```

### travel

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: two fantasy travelers, an adult charcoal-skinned white-haired dark elf in a green cloak and a sturdy red-bearded dwarf, arranging a room with a friendly human innkeeper at a wooden reception counter. The innkeeper offers a big brass room key, a folded map lies between their hands, a packed travel bag and rolled blanket are prominent in foreground. Warm welcoming inn interior, clearly a practical travel and booking situation, medium close composition, no signs or writing.
```

### work

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: Bruenor Battlehammer, a broad sturdy copper-red-bearded dwarf smith in a thick leather apron, proudly working at a fantasy forge. He holds a small hammer and carefully shapes a glowing brass horseshoe on an anvil, large tools and craftsmanship clearly visible. Warm forge light, expressive focused face, two gloved hands, detailed wood and metal materials, cozy working workshop, no combat or weapons manufacturing.
```

### documents

```text
Use case: stylized-concept. Asset type: large thumbnail illustration for a fantasy Italian-reading topic card. Premium stylized 3D narrative game illustration, sculpted characters with hand-painted textures, expressive readable faces, rich tactile cloth, warm amber lantern light balanced by deep emerald and blue shadows, coherent cozy high-fantasy adventure world. Landscape 3:2 frame. Close or medium composition with the main people and meaningful objects large and clearly readable, filling most of the frame. Background atmospheric and simplified, no small distant diorama, no floating island. Keep all faces safely inside the central 75% to allow a slightly wide crop. No writing, lettering, subtitles, UI, logos, watermark or decorative border. Subject: a friendly elderly fantasy town clerk with silver hair in dark teal robes helping a young adult traveler complete paperwork across a wooden counter. A clearly visible large cream parchment, quill pen, small inkpot and rich red wax seal in the foreground, clerk points gently to the place to sign and traveler holds the quill. Large expressive faces and practical paperwork objects, warm arched office window, no readable text or lettering on parchment.
```
