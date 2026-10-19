import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import type { CurriculumLesson, CurriculumUnit } from "../types";
import { ItalianProgressBar, WhiteMagicGlow } from "./LearningCardEffects";

type Location = { artwork: string; name: string; description: string };
const locations: Record<string, Location> = {
  cafe: { artwork: "tavern", name: "Затишна таверна", description: "Замовляй напої та їжу, уточнюй склад і проси рахунок." },
  city: { artwork: "city", name: "Містечко пригод", description: "Знаходь дорогу, уточнюй маршрут і купуй квитки." },
  shopping: { artwork: "market", name: "Ринкова площа", description: "Шукай товари, обирай кількість і домовляйся про оплату." },
  introductions: { artwork: "square", name: "Площа знайомств", description: "Представляйся, розповідай про себе й знайомся з іншими." },
  documents: { artwork: "archive", name: "Міська канцелярія", description: "Уточнюй документи, подавай бланки й записуйся на прийом." },
  work: { artwork: "workshop", name: "Майстерня ремесел", description: "Розповідай про роботу, узгоджуй графік і перепитуй колег." },
  health: { artwork: "healer", name: "Дім цілителя", description: "Описуй самопочуття та уточнюй час візиту до лікаря." },
  "experiences-a2": { artwork: "observatory", name: "Вежа мандрівника", description: "Розповідай про вчорашні події, плани та їхні причини." },
  "decisions-a2": { artwork: "crossroads", name: "Перехрестя рішень", description: "Порівнюй варіанти, пропонуй ідеї та узгоджуй плани." },
  "housing-life": { artwork: "city", name: "Квартал нового дому", description: "Шукай житло, уточнюй витрати й домовляйся про ремонт." },
  "phone-internet": { artwork: "observatory", name: "Вежа зв’язку", description: "Обирай зв’язок, підключай інтернет і звертайся по допомогу." },
  "money-bills": { artwork: "archive", name: "Гільдія рахівників", description: "Розбирайся з рахунками, строками оплати й підтвердженнями." },
  "everyday-services": { artwork: "workshop", name: "Квартал майстрів", description: "Отримуй посилки, перенось доставку й користуйся послугами." },
  "school-family": { artwork: "/reading-worlds/academy.webp", name: "Академія перших кроків", description: "Спілкуйся зі школою, домовляйся про зустрічі й уточнюй розклад." },
  "neighbors-building": { artwork: "/reading-worlds/home.webp", name: "Двір добрих сусідів", description: "Знайомся із сусідами й домовляйся про спільний простір." },
  "daily-mobility": { artwork: "/reading-worlds/harbor.webp", name: "Брама щоденних мандрів", description: "Обирай проїзний, роби пересадки й знаходь загублені речі." },
  "job-search": { artwork: "workshop", name: "Гільдія нових можливостей", description: "Відгукуйся на вакансії, розповідай про досвід і проходь співбесіди." },
};

function locationFor(unit: CurriculumUnit): Location {
  return locations[unit.id] ?? { artwork: "city", name: unit.title, description: "Нова локація для практики італійської в життєвих ситуаціях." };
}

function sceneFor(location: Location): string {
  return location.artwork.startsWith("/") ? location.artwork : `/lesson-worlds/${location.artwork}.webp`;
}

function isReviewDue(lesson: CurriculumLesson): boolean {
  return Boolean(lesson.progress.next_review_at && new Date(lesson.progress.next_review_at).getTime() <= Date.now());
}

function lessonStatus(lesson: CurriculumLesson): string {
  if (!lesson.available) return "Незабаром";
  if (lesson.active_session_id) return "Розпочато";
  if (isReviewDue(lesson)) return "Час повторити";
  if (lesson.progress.confirmed_at) return "Підтверджено";
  if (lesson.progress.independent_at) return "Самостійно";
  return lesson.completed_count_all_versions > 0 ? "Пройдено" : "Новий урок";
}

type Connection = { path: string; x: number; y: number; complete: boolean };

function JourneyConnections({ grid, completed }: { grid: RefObject<HTMLOListElement | null>; completed: boolean[] }) {
  const [drawing, setDrawing] = useState({ width: 1, height: 1, connections: [] as Connection[] });
  const completionKey = completed.join(",");
  useEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const cards = Array.from(element.querySelectorAll<HTMLElement>(".journey-location"), (node) => node.getBoundingClientRect());
      const connections = cards.slice(1).map((to, index) => {
        const from = cards[index];
        const sameRow = Math.abs(from.top - to.top) < 2;
        const right = to.left > from.left;
        const x1 = (sameRow ? right ? from.right : from.left : from.left + from.width / 2) - bounds.left;
        const y1 = (sameRow ? from.top + from.height / 2 : from.bottom) - bounds.top;
        const x2 = (sameRow ? right ? to.left : to.right : to.left + to.width / 2) - bounds.left;
        const y2 = (sameRow ? to.top + to.height / 2 : to.top) - bounds.top;
        const middle = (y1 + y2) / 2;
        return { path: sameRow ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`, x: (x1 + x2) / 2, y: middle, complete: completed[index] };
      });
      setDrawing({ width: bounds.width, height: bounds.height, connections });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.querySelectorAll(".journey-location").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // Completion changes only affect the path colors.
  }, [grid, completionKey]);
  return <svg className="journey-connections" viewBox={`0 0 ${drawing.width} ${drawing.height}`} aria-hidden="true">
    {drawing.connections.map((connection, index) => <g key={index} className={connection.complete ? "is-complete" : ""}>
      <path d={connection.path} />
      <circle cx={connection.x} cy={connection.y} r="4" />
    </g>)}
  </svg>;
}

export function LearningJourney({ units, lessons, nextLessonId, launching, error, onLaunch }: {
  units: CurriculumUnit[];
  lessons: CurriculumLesson[];
  nextLessonId: string | null;
  launching: boolean;
  error?: string;
  onLaunch: (lesson: CurriculumLesson) => void;
}) {
  const grid = useRef<HTMLOListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = units.find((unit) => unit.id === selectedId);
  const selectedLocation = selected && locationFor(selected);
  const nextUnit = lessons.find((lesson) => lesson.id === nextLessonId)?.unit_id;
  const unitLessons = units.map((unit) => lessons.filter((lesson) => lesson.unit_id === unit.id));
  const completed = unitLessons.map((items) => items.filter((lesson) => lesson.available && lesson.completed_count_all_versions > 0).length);
  const complete = unitLessons.map((items, index) => items.length > 0 && completed[index] === items.length);

  useEffect(() => {
    if (selectedId) dialog.current?.showModal();
  }, [selectedId]);

  return <>
    <section className="journey" aria-label="Мапа уроків">
      <div className="journey-map-wrap">
        <JourneyConnections grid={grid} completed={complete} />
      <ol className="journey-map" ref={grid}>
        {units.map((unit, index) => {
          const location = locationFor(unit);
          const row = Math.floor(index / 3);
          const tabletRow = Math.floor(index / 2);
          const isNext = unit.id === nextUnit;
          const total = unitLessons[index].length;
          return <li className="journey-stop" key={unit.id} style={{
            "--map-column": row % 2 ? 3 - index % 3 : index % 3 + 1,
            "--map-row": row + 1,
            "--tablet-column": tabletRow % 2 ? 2 - index % 2 : index % 2 + 1,
            "--tablet-row": tabletRow + 1,
          } as CSSProperties}>
            <button className={`journey-location ${isNext ? "is-current" : ""} ${complete[index] ? "is-complete" : ""}`} onClick={() => setSelectedId(unit.id)} aria-haspopup="dialog" aria-current={isNext ? "step" : undefined} aria-label={`${isNext ? "Рекомендована локація. " : ""}${unit.title}. ${location.name}. Пройдено ${completed[index]} з ${total} уроків. Відкрити уроки`}>
              <span className="journey-scene"><img src={sceneFor(location)} alt="" width="768" height="512" loading={index < 3 ? "eager" : "lazy"} decoding="async" /></span>
              {isNext && <WhiteMagicGlow />}
              <span className="journey-location-meta"><span className="journey-number">{String(index + 1).padStart(2, "0")}</span><span className="journey-badge">{complete[index] ? "✓ Пройдено" : unit.level}</span></span>
              <span className="journey-location-copy"><span className="journey-place-name">{location.name}</span><strong>{unit.title}</strong><span className="journey-description">{location.description}</span>
                <span className="journey-location-footer"><span className="journey-completion">{completed[index]}/{total} пройдено</span><span className="journey-enter">Уроки <span aria-hidden="true">→</span></span></span>
              </span>
              <ItalianProgressBar value={completed[index]} total={total} />
            </button>
          </li>;
        })}
      </ol>
      </div>
    </section>
    <dialog ref={dialog} className="journey-dialog" aria-labelledby="location-title" aria-describedby="location-description" onClose={() => setSelectedId(null)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      {selected && selectedLocation && <div className="journey-dialog-content">
        <button className="journey-dialog-close" aria-label="Закрити локацію" autoFocus onClick={() => dialog.current?.close()}>×</button>
        <header className="journey-dialog-heading">
          <div><span className="journey-eyebrow">{selectedLocation.name} · {selected.level}</span><h2 id="location-title">{selected.title}</h2><p id="location-description">{selectedLocation.description}</p></div>
          <img src={sceneFor(selectedLocation)} alt="" width="768" height="512" />
        </header>
        <ol className="journey-lessons">
          {lessons.filter((lesson) => lesson.unit_id === selected.id).map((lesson, index) => {
            const done = lesson.completed_count_all_versions > 0;
            const due = isReviewDue(lesson);
            return <li className={`journey-lesson ${lesson.id === nextLessonId ? "is-next" : ""} ${done ? "is-done" : ""}`} key={lesson.id}>
              <span className="journey-lesson-number" aria-hidden="true">{done ? "✓" : index + 1}</span>
              <div className="journey-lesson-copy"><span className="journey-lesson-status">{lessonStatus(lesson)}{lesson.id === nextLessonId ? " · наступний крок" : ""}</span><h3>{lesson.title}</h3><p>{lesson.goal}</p>
                {(lesson.progress.next_review_at || (done && !lesson.progress.completed_count) || (lesson.available && !lesson.recommended_prerequisites_met)) && <details className="journey-lesson-details"><summary>Деталі уроку</summary>
                  {lesson.progress.next_review_at && <p>Повторення: {new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" }).format(new Date(lesson.progress.next_review_at))}</p>}
                  {done && !lesson.progress.completed_count && <p>Попередню версію пройдено. Оновлена має окрему перевірку.</p>}
                  {lesson.available && !lesson.recommended_prerequisites_met && <p>Рекомендуємо спершу: {lesson.prerequisites.map((id) => lessons.find((item) => item.id === id)?.title ?? id).join(", ")}.</p>}
                </details>}
              </div>
              <button className="ui-button journey-lesson-start" disabled={!lesson.available || launching} onClick={() => onLaunch(lesson)} aria-label={`${lesson.active_session_id ? "Продовжити" : due ? "Повторити" : done ? "Практикувати" : "Почати"}: ${lesson.title}`}>
                {launching ? "Відкриваємо…" : !lesson.available ? "Незабаром" : lesson.active_session_id ? "Продовжити" : due ? "Повторити" : done ? "Практика" : "Почати"}<span aria-hidden="true">→</span>
              </button>
            </li>;
          })}
        </ol>
        {error && <p role="alert" className="mixed-error">{error}</p>}
        <p className="journey-dialog-note">Локації підказують маршрут. Доступні уроки можна проходити у своєму темпі.</p>
      </div>}
    </dialog>
  </>;
}
