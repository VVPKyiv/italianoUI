import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";
import { useMarqueeSelection } from "../hooks/useMarqueeSelection";
import type { TrainingTopic } from "../types";

type LevelTab = "all" | "A0" | "A1" | "A2";
type TrainingMode = "speech" | "sentence" | "listening" | "matching" | "crossword" | "mixed";
const selectionKey = "italiano:selected-topics";

function storedSelection(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(selectionKey) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function progressLabel(value: number): string {
  return value > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
}

function sentenceCountLabel(value: number): string {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11
    ? "речення"
    : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
      ? "речення"
      : "речень";
  return `${value} ${noun}`;
}

function wordCountLabel(value: number): string {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11
    ? "слово"
    : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
      ? "слова"
      : "слів";
  return `${value} ${noun}`;
}

function topicCountLabel(value: number): string {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11
    ? "тема"
    : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
      ? "теми"
      : "тем";
  return `${value} ${noun}`;
}

export function TrainingSetupPage() {
  const [count, setCount] = useState(10);
  const [tab, setTab] = useState<LevelTab>("all");
  const [selected, setSelected] = useState<string[]>(storedSelection);
  const { mode: modeParam } = useParams();
  const [searchParams] = useSearchParams();
  const recommendedCategory = searchParams.get("category");
  const mode: TrainingMode = modeParam === "sentence"
    ? "sentence"
    : modeParam === "listening" ? "listening"
      : modeParam === "matching" ? "matching"
        : modeParam === "crossword" ? "crossword"
          : modeParam === "mixed" ? "mixed" : "speech";
  const navigate = useNavigate();
  const topicsQuery = useQuery({ queryKey: ["training-topics"], queryFn: api.topics });
  const sentenceTopicsQuery = useQuery({ queryKey: ["sentence-topics"], queryFn: api.sentenceTopics });
  const listeningTopicsQuery = useQuery({ queryKey: ["listening-topics"], queryFn: api.listeningTopics });
  const matchingTopicsQuery = useQuery({ queryKey: ["matching-topics"], queryFn: api.matchingTopics });
  const crosswordTopicsQuery = useQuery({ queryKey: ["crossword-topics"], queryFn: api.crosswordTopics });
  const topics = topicsQuery.data ?? [];
  const sentenceTopics = sentenceTopicsQuery.data ?? {};
  const listeningTopics = listeningTopicsQuery.data ?? {};
  const matchingTopics = matchingTopicsQuery.data ?? {};
  const crosswordTopics = crosswordTopicsQuery.data ?? {};

  useEffect(() => {
    if (!topics.length) return;
    const available = new Set(topics.map((topic) => topic.category));
    setSelected((current) => {
      const valid = current.filter((category) => available.has(category));
      if (valid.length) return valid;
      return available.has("greetings") ? ["greetings"] : [topics[0].category];
    });
  }, [topics]);

  useEffect(() => {
    if (recommendedCategory && topics.some((topic) => topic.category === recommendedCategory)) {
      setSelected([recommendedCategory]);
    }
  }, [recommendedCategory, topics]);

  useEffect(() => {
    const availableTopics = mode === "sentence"
      ? sentenceTopics
      : mode === "listening" ? listeningTopics
        : mode === "matching" ? matchingTopics
          : mode === "crossword" ? crosswordTopics : null;
    if (!availableTopics || !Object.keys(availableTopics).length) return;
    setSelected((current) => {
      const available = current.filter((category) => availableTopics[category]);
      const fallback = availableTopics.greetings ? "greetings" : Object.keys(availableTopics)[0];
      return available.length ? available : [fallback];
    });
  }, [crosswordTopics, listeningTopics, matchingTopics, mode, sentenceTopics]);

  useEffect(() => {
    localStorage.setItem(selectionKey, JSON.stringify(selected));
  }, [selected]);

  const visibleTopics = useMemo(
    () => topics.filter((topic) => tab === "all" || topic.cefr_level === tab),
    [tab, topics],
  );
  const isUnavailable = (topic: TrainingTopic) => (mode === "sentence" && !(sentenceTopics[topic.category] > 0))
    || (mode === "listening" && !(listeningTopics[topic.category] > 0))
    || (mode === "matching" && !(matchingTopics[topic.category] >= 7))
    || (mode === "crossword" && !(crosswordTopics[topic.category] >= 6));
  const selection = useMarqueeSelection({
    ids: visibleTopics.filter((topic) => !isUnavailable(topic)).map((topic) => topic.category),
    selected,
    onChange: setSelected,
    scope: `${mode}:${tab}`,
  });
  const selectedTopics = topics.filter((topic) => selected.includes(topic.category));
  const selectedWordCount = selectedTopics.reduce((sum, topic) => sum + topic.word_count, 0);
  const selectedSentenceCount = selected.reduce((sum, category) => sum + (sentenceTopics[category] ?? 0), 0);
  const selectedListeningCount = selected.reduce((sum, category) => sum + (listeningTopics[category] ?? 0), 0);
  const selectedMatchingCount = selected.reduce((sum, category) => sum + (matchingTopics[category] ?? 0), 0);
  const selectedCrosswordCount = selected.reduce((sum, category) => sum + (crosswordTopics[category] ?? 0), 0);
  const totalWords = topics.reduce((sum, topic) => sum + topic.word_count, 0);
  const reviewedWords = topics.reduce((sum, topic) => sum + topic.reviewed_count, 0);


  const create = useMutation({
    mutationFn: async (categories: string[]): Promise<{ id: string }> => {
      const launchLevels = [...new Set(
        topics
          .filter((topic) => categories.includes(topic.category))
          .map((topic) => topic.cefr_level),
      )];
      if (mode === "speech") return await api.createSession(count, categories, launchLevels);
      if (mode === "sentence") return await api.createSentenceSession(count, categories);
      if (mode === "listening") return await api.createListeningSession(count, categories);
      if (mode === "matching") return await api.createMatchingSession(categories, launchLevels);
      if (mode === "mixed") return await api.createMixedSession(categories);
      return await api.createCrosswordSession(count, categories, launchLevels);
    },
    onSuccess: (session) => navigate(mode === "mixed"
      ? `/mixed/${session.id}`
      : mode === "speech"
        ? `/training/${session.id}`
        : mode === "sentence" ? `/sentences/${session.id}`
          : mode === "listening" ? `/listening/${session.id}`
            : mode === "matching" ? `/matching/${session.id}` : `/crossword/${session.id}`),
  });

  const launchSingleTopic = (category: string) => {
    if (create.isPending) return;
    setSelected([category]);
    create.mutate([category]);
  };

  return (
    <div className="luxury-home training-setup-page">
      <div className="home-dashboard training-setup-dashboard shell">
        <header className="drive-heading">
          <div>
            <div className="setup-heading-meta">
              <Link className="setup-back" to="/">← Усі тренування</Link>

            </div>
            <h1>{mode === "speech" ? "Вимова" : mode === "sentence" ? "Речення" : mode === "listening" ? "Аудіювання" : mode === "matching" ? "Знайди пару" : mode === "mixed" ? "Змішаний урок" : "Кросворд"}</h1>
          </div>
          <Link className="setup-progress-link" to="/progress#vocabulary-progress">Слова в практиці <b>{reviewedWords}/{totalWords}</b> <span aria-hidden="true">↗</span></Link>
        </header>

        <section className="topic-selector" aria-labelledby="topics-title">
          <div className="selector-toolbar">
            <div>

              <h2 id="topics-title">Обери теми</h2>
            </div>
            <div className="selection-controls">
              <span id="topic-selection-hint" className="multi-select-hint">
                <span className="topic-selection-desktop-hint">Рамка мишкою — кілька тем · Ctrl/⌘ — додати · Shift — діапазон</span>
                <span className="topic-selection-touch-hint">Натисніть на теми, щоб вибрати кілька</span>
              </span>
              <button className="clear-selection" onClick={() => setSelected([])} disabled={!selected.length}>Очистити</button>
            </div>
          </div>

          <div className="level-tabs" role="tablist" aria-label="Рівень складності">
            {(["all", "A0", "A1", "A2"] as LevelTab[]).map((level) => (
              <button
                key={level}
                role="tab"
                aria-selected={tab === level}
                className={tab === level ? "active" : ""}
                onClick={() => setTab(level)}
              >
                {level === "all" ? "Усі теми" : `${level} · ${level === "A0" ? "Початок" : level === "A1" ? "База" : "Наступний крок"}`}
              </button>
            ))}
          </div>

          <div
            ref={selection.areaRef}
            className={`topic-scroll-area ${selection.marquee ? "is-selecting" : ""}`}
            role="group"
            aria-label="Теми тренування"
            aria-describedby="topic-selection-hint"
            tabIndex={0}
            {...selection.areaProps}
          >
            {topicsQuery.isPending && <div className="topics-state">Завантажуємо тематичний каталог…</div>}
            {topicsQuery.isError && <div className="topics-state error">Не вдалося завантажити теми. Оновіть сторінку.</div>}
            <div className="topic-grid">
              {visibleTopics.map((topic) => {
                const view = presentationFor(topic.category);
                const active = selected.includes(topic.category);
                const sentenceCount = sentenceTopics[topic.category] ?? 0;
                const listeningCount = listeningTopics[topic.category] ?? 0;
                const matchingCount = matchingTopics[topic.category] ?? 0;
                const crosswordCount = crosswordTopics[topic.category] ?? 0;
                const unavailable = isUnavailable(topic);
                return (
                  <button
                    key={`${topic.cefr_level}-${topic.category}`}
                    data-selection-id={topic.category}
                    className={`topic-tile accent-${view.accent} ${active ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}
                    aria-pressed={active}
                    disabled={unavailable}
                    title="Клік — вибрати; Ctrl/⌘-клік — додати або зняти; Shift-клік — діапазон; подвійний клік — почати"
                    onClick={(event) => selection.onItemClick(event, topic.category)}
                    onDoubleClick={() => launchSingleTopic(topic.category)}
                  >
                    <span className="topic-check" aria-hidden="true">{active ? "✓" : "+"}</span>
                    <span className="topic-mark">{view.mark}</span>
                    <span className="topic-level">{topic.cefr_level} · {view.italian}</span>
                    <strong>{view.title}</strong>
                    {mode === "speech" || mode === "mixed" ? (
                      <>
                        <span className="topic-progress-copy">
                          <b>{progressLabel(topic.mastery_percent)}%</b>
                          <span>{topic.reviewed_count}/{topic.word_count} розпочато</span>
                        </span>
                        <span className="topic-progress" aria-label={`Прогрес теми ${progressLabel(topic.mastery_percent)} відсотків`}>
                          <i style={{ width: topic.mastery_percent > 0 ? `max(3px, ${topic.mastery_percent}%)` : "0" }} />
                        </span>
                      </>
                    ) : (
                      <span className="sentence-topic-count">{mode === "sentence"
                        ? (sentenceCount ? sentenceCountLabel(sentenceCount) : "Незабаром")
                        : mode === "listening" ? (listeningCount ? `${wordCountLabel(listeningCount)} з аудіо` : "Аудіо відсутнє")
                          : mode === "matching" ? (matchingCount >= 7 ? `${wordCountLabel(matchingCount)} для пар` : "Замало слів")
                            : (crosswordCount >= 6 ? `${wordCountLabel(crosswordCount)} для сітки` : "Замало слів")}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selection.marquee && <div className="topic-selection-marquee" aria-hidden="true" style={{
              left: selection.marquee.x,
              top: selection.marquee.y,
              width: selection.marquee.width,
              height: selection.marquee.height,
            }} />}
          </div>

          <section className="launch-panel">
            <div className="launch-copy">

              <strong>{selected.length ? `${topicCountLabel(selected.length)} · ${mode === "speech" || mode === "mixed" ? wordCountLabel(selectedWordCount) : mode === "sentence" ? sentenceCountLabel(selectedSentenceCount) : mode === "listening" ? `${wordCountLabel(selectedListeningCount)} з аудіо` : mode === "matching" ? `${wordCountLabel(selectedMatchingCount)} для пар` : `${wordCountLabel(selectedCrosswordCount)} для сітки`} доступно` : "Оберіть хоча б одну тему"}</strong>
            </div>
            {mode !== "matching" && mode !== "mixed" && <div className="session-size" aria-label="Кількість вправ у тренуванні">
              <span>{mode === "speech" ? "Кількість слів" : mode === "sentence" ? "Кількість речень" : mode === "listening" ? "Кількість вправ" : "Слів у кросворді"}</span>
              <div>
                {(mode === "crossword" ? [6, 8, 10, 12] : [5, 10, 20]).map((value) => (
                  <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>
                ))}
              </div>
            </div>}
            <button className="launch-button" disabled={!selected.length || (mode === "sentence" && !selectedSentenceCount) || (mode === "listening" && !selectedListeningCount) || (mode === "matching" && selectedMatchingCount < 7) || (mode === "crossword" && selectedCrosswordCount < count) || create.isPending} onClick={() => create.mutate([...selected])}>
              <span>{create.isPending ? "Готуємо тренування…" : mode === "speech" ? "Почати вимову" : mode === "sentence" ? "Складати речення" : mode === "listening" ? "Почати слухати" : mode === "matching" ? "Знайти 7 пар" : mode === "mixed" ? "Почати урок із 10 карток" : "Створити кросворд"}</span>
              <b>→</b>
            </button>
            {create.error && <p className="launch-error">{create.error.message}</p>}
          </section>
        </section>
      </div>
    </div>
  );
}
