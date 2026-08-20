import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

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
    mutationFn: () => api.createReadingSession(selected, level === "ALL" ? [] : [level]),
    onSuccess: (session) => navigate(`/reading/${session.id}`),
  });

  const toggle = (category: string) => {
    setSelected((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

  return (
    <div className="reading-library shell">
      <header className="reading-library-head">
        <div>
          <span className="luxury-kicker"><i /> LETTURA ITALIANA</span>
          <h1>Leggi. Capisci. <em>Ricorda.</em></h1>
          <p>Короткі живі історії з перекладом слів, озвученням і питаннями на розуміння.</p>
        </div>
        <aside className="reading-stat-card">
          <strong>{stats ? `${stats.completed_texts}/${stats.total_texts}` : "—"}</strong>
          <span>текстів завершено</span>
          <small>Найкращий середній результат: {stats?.average_best_score ?? 0}%</small>
        </aside>
      </header>

      <section className="reading-picker">
        <div className="reading-picker-title">
          <div><small>PASSO 01</small><h2>Обери рівень і тему</h2></div>
          <div className="reading-levels" aria-label="Складність тексту">
            {(["ALL", "A0", "A1", "A2"] as Level[]).map((item) => (
              <button key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setSelected([]); }}>
                {item === "ALL" ? "Усі" : item}
              </button>
            ))}
          </div>
        </div>

        {topicsQuery.isPending ? <div className="reading-loading">Завантажуємо бібліотеку…</div> : (
          <div className="reading-topic-grid">
            {visible.map(([category, data]) => {
              const view = presentationFor(category);
              const chosen = selected.includes(category);
              return (
                <button
                  key={category}
                  className={`reading-topic ${chosen ? "selected" : ""}`}
                  onClick={() => toggle(category)}
                  onDoubleClick={() => api.createReadingSession([category], level === "ALL" ? [] : [level]).then((session) => navigate(`/reading/${session.id}`))}
                >
                  <span className="reading-topic-mark">{view.mark}</span>
                  <small>{[...data.levels].join(" · ")} · {view.italian}</small>
                  <h3>{view.title}</h3>
                  <p>{view.description}</p>
                  <footer><span>{data.completedCount}/{data.textCount} прочитано</span><b>{chosen ? "✓" : "+"}</b></footer>
                </button>
              );
            })}
          </div>
        )}

        <footer className="reading-launch-panel">
          <div><small>PASSO 02</small><b>{selected.length ? `Обрано тем: ${selected.length}` : "Випадкова тема"}</b></div>
          <button className="launch-button" disabled={create.isPending || !visible.length} onClick={() => create.mutate()}>
            <span>{create.isPending ? "Готуємо текст…" : "Почати читання"}</span><b>→</b>
          </button>
        </footer>
      </section>
    </div>
  );
}
