import { PageHeading } from "../components/PageHeading";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";
import { artworkForReading } from "../content/readingArtwork";
import { ItalianProgressBar, WhiteMagicGlow } from "../components/LearningCardEffects";

type Level = "ALL" | "A0" | "A1" | "A2";

export function ReadingLibraryPage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<Level>("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const topicsQuery = useQuery({ queryKey: ["reading-topics"], queryFn: api.readingTopics });
  const statsQuery = useQuery({ queryKey: ["reading-stats"], queryFn: api.readingStats });
  const topics = topicsQuery.data ?? [];
  const visible = useMemo(() => {
    const grouped = new Map<string, { textCount: number; completedCount: number; levels: Set<string> }>();
    topics.filter((item) => level === "ALL" || item.cefr_level === level).forEach((item) => {
      const value = grouped.get(item.category) ?? { textCount: 0, completedCount: 0, levels: new Set<string>() };
      value.textCount += item.text_count;
      value.completedCount += item.completed_count;
      value.levels.add(item.cefr_level);
      grouped.set(item.category, value);
    });
    return [...grouped.entries()];
  }, [level, topics]);
  const stats = statsQuery.data;

  const create = useMutation({
    mutationFn: (categories?: string[]) => api.createReadingSession(categories ?? selected, level === "ALL" ? [] : [level]),
    onSuccess: (session) => navigate(`/reading/${session.id}`),
  });

  const toggle = (category: string) => {
    setSelected((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  return (
    <div className="reading-library shell">
      <PageHeading title="Читання" description={stats ? `Прочитано ${stats.completed_texts} із ${stats.total_texts}` : "Історії з аудіо та перекладом"} aside={
        <div className="reading-levels" role="group" aria-label="Складність тексту">
          {(["ALL", "A0", "A1", "A2"] as Level[]).map((item) => (
            <button key={item} className={level === item ? "active" : ""} aria-pressed={level === item} onClick={() => { setLevel(item); setSelected([]); }}>
              {item === "ALL" ? "Усі" : item}
            </button>
          ))}
        </div>
      } />

      <section className="reading-picker" aria-label="Теми для читання">
        {topicsQuery.isError && <p className="ui-error" role="alert">Не вдалося завантажити теми. <button onClick={() => void topicsQuery.refetch()}>Спробувати ще раз</button></p>}
        {topicsQuery.isPending ? <div className="reading-loading">Завантажуємо бібліотеку…</div> : (
          <div className="reading-topic-grid">
            {!visible.length && !topicsQuery.isError && <p className="reading-empty" role="status">Для цього рівня поки немає текстів.</p>}
            {visible.map(([category, data]) => {
              const view = presentationFor(category);
              const chosen = selected.includes(category);
              return (
                <button
                  key={category}
                  className={`reading-topic ${chosen ? "selected" : ""}`}
                  aria-pressed={chosen}
                  aria-label={`${view.title}. ${view.description}. Прочитано ${data.completedCount} із ${data.textCount}`}
                  onClick={() => toggle(category)}
                  onDoubleClick={() => { if (!create.isPending) create.mutate([category]); }}
                >
                  <span className="reading-topic-scene"><img className={["weather-seasons", "city-places", "environment-city-life"].includes(category) ? "is-diorama" : undefined} src={artworkForReading(category)} alt="" width="900" height="600" loading="lazy" decoding="async" /></span>
                  {chosen && <WhiteMagicGlow />}
                  <span className="reading-topic-level">{[...data.levels].join(" · ")}</span>
                  <span className="reading-topic-select" aria-hidden="true">{chosen ? "✓" : "+"}</span>
                  <span className="reading-topic-copy"><strong className="reading-topic-name">{view.title}</strong>
                    <span className="reading-topic-footer">Прочитано {data.completedCount} із {data.textCount}</span>
                  </span>
                  <ItalianProgressBar value={data.completedCount} total={data.textCount} />
                </button>
              );
            })}
          </div>
        )}

        <footer className="reading-launch-panel">
          <div><b aria-live="polite">{selected.length ? `Обрано тем: ${selected.length}` : "Усі теми"}</b>{selected.length > 0 && <button className="reading-clear" onClick={() => setSelected([])}>Скинути</button>}</div>
          <button className="ui-button reading-start" disabled={create.isPending || !visible.length} onClick={() => create.mutate(undefined)}>
            <span>{create.isPending ? "Готуємо текст…" : "Почати читання"}</span><span aria-hidden="true">→</span>
          </button>
        </footer>
        {create.isError && <p className="ui-error" role="alert">{create.error.message}</p>}
      </section>
    </div>
  );
}
