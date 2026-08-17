import { useMutation, useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

type LevelTab = "all" | "A0" | "A1";
type TrainingMode = "speech" | "sentence" | "listening" | "matching" | "crossword";
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
        : modeParam === "crossword" ? "crossword" : "speech";
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
  const selectedTopics = topics.filter((topic) => selected.includes(topic.category));
  const selectedWordCount = selectedTopics.reduce((sum, topic) => sum + topic.word_count, 0);
  const selectedSentenceCount = selected.reduce((sum, category) => sum + (sentenceTopics[category] ?? 0), 0);
  const selectedListeningCount = selected.reduce((sum, category) => sum + (listeningTopics[category] ?? 0), 0);
  const selectedMatchingCount = selected.reduce((sum, category) => sum + (matchingTopics[category] ?? 0), 0);
  const selectedCrosswordCount = selected.reduce((sum, category) => sum + (crosswordTopics[category] ?? 0), 0);
  const totalWords = topics.reduce((sum, topic) => sum + topic.word_count, 0);
  const reviewedWords = topics.reduce((sum, topic) => sum + topic.reviewed_count, 0);
  const masteredWords = topics.reduce((sum, topic) => sum + topic.mastered_count, 0);
  const overallMastery = totalWords
    ? topics.reduce((sum, topic) => sum + topic.mastery_percent * topic.word_count, 0) / totalWords
    : 0;

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
      return await api.createCrosswordSession(count, categories, launchLevels);
    },
    onSuccess: (session) => navigate(mode === "speech"
      ? `/training/${session.id}`
      : mode === "sentence" ? `/sentences/${session.id}`
        : mode === "listening" ? `/listening/${session.id}`
          : mode === "matching" ? `/matching/${session.id}` : `/crossword/${session.id}`),
  });

  const toggle = (category: string) => {
    setSelected((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

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
              <span className="luxury-kicker"><i /> {mode === "speech" ? "PRONUNCIA" : mode === "sentence" ? "COSTRUISCI LA FRASE" : mode === "listening" ? "ASCOLTO" : mode === "matching" ? "ABBINA" : "PAROLE INCROCIATE"}</span>
            </div>
            <h1>Обери тему для <em>{mode === "speech" ? "вимови." : mode === "sentence" ? "речень." : mode === "listening" ? "аудіювання." : mode === "matching" ? "пошуку пар." : "кросворду."}</em></h1>
          </div>
          <aside className="overview-card" aria-label={`Загальний прогрес ${progressLabel(overallMastery)}%`}>
            <div className="italian-stripe" aria-label="Кольори прапора Італії"><i /><i /><i /></div>
            <div className="overview-ring" style={{ "--overall": `${overallMastery * 3.6}deg` } as CSSProperties}>
              <strong>{progressLabel(overallMastery)}%</strong>
              <small>загалом</small>
            </div>
            <div className="overview-copy">
              <span>IL TUO PROGRESSO</span>
              <b>Твій прогрес</b>
              <small>{reviewedWords} з {totalWords} слів розпочато</small>
              <small>{masteredWords} слів упевнено засвоєно</small>
            </div>
          </aside>
        </header>

        <section className="topic-selector" aria-labelledby="topics-title">
          <div className="selector-toolbar">
            <div>
              <small>КРОК 01</small>
              <h2 id="topics-title">Тема тренування</h2>
            </div>
            <div className="selection-controls">
              <span className="multi-select-hint">Один клік — вибрати · подвійний — почати</span>
              <button className="clear-selection" onClick={() => setSelected([])} disabled={!selected.length}>Очистити</button>
            </div>
          </div>

          <div className="level-tabs" role="tablist" aria-label="Рівень складності">
            {(["all", "A0", "A1"] as LevelTab[]).map((level) => (
              <button
                key={level}
                role="tab"
                aria-selected={tab === level}
                className={tab === level ? "active" : ""}
                onClick={() => setTab(level)}
              >
                {level === "all" ? "Усі теми" : `${level} · ${level === "A0" ? "Початок" : "База"}`}
              </button>
            ))}
          </div>

          <div className="topic-scroll-area">
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
                const unavailable = (mode === "sentence" && sentenceCount === 0)
                  || (mode === "listening" && listeningCount === 0)
                  || (mode === "matching" && matchingCount < 7)
                  || (mode === "crossword" && crosswordCount < 6);
                return (
                  <button
                    key={`${topic.cefr_level}-${topic.category}`}
                    className={`topic-tile accent-${view.accent} ${active ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}
                    aria-pressed={active}
                    disabled={unavailable}
                    title="Один клік — вибрати тему, подвійний — одразу почати"
                    onClick={() => toggle(topic.category)}
                    onDoubleClick={() => launchSingleTopic(topic.category)}
                  >
                    <span className="topic-check" aria-hidden="true">{active ? "✓" : "+"}</span>
                    <span className="topic-mark">{view.mark}</span>
                    <span className="topic-level">{topic.cefr_level} · {view.italian}</span>
                    <strong>{view.title}</strong>
                    <small>{view.description}</small>
                    {mode === "speech" ? (
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
          </div>

          <section className="launch-panel">
            <div className="launch-copy">
              <small>КРОК 02</small>
              <strong>{selected.length ? `${topicCountLabel(selected.length)} · ${mode === "speech" ? wordCountLabel(selectedWordCount) : mode === "sentence" ? sentenceCountLabel(selectedSentenceCount) : mode === "listening" ? `${wordCountLabel(selectedListeningCount)} з аудіо` : mode === "matching" ? `${wordCountLabel(selectedMatchingCount)} для пар` : `${wordCountLabel(selectedCrosswordCount)} для сітки`} доступно` : "Оберіть хоча б одну тему"}</strong>
            </div>
            {mode !== "matching" && <div className="session-size" aria-label="Кількість вправ у тренуванні">
              <span>{mode === "speech" ? "Слів за заїзд" : mode === "sentence" ? "Речень за сесію" : mode === "listening" ? "Аудіокарток за сесію" : "Слів у кросворді"}</span>
              <div>
                {(mode === "crossword" ? [6, 8, 10, 12] : [5, 10, 20]).map((value) => (
                  <button key={value} className={count === value ? "active" : ""} onClick={() => setCount(value)}>{value}</button>
                ))}
              </div>
            </div>}
            <button className="launch-button" disabled={!selected.length || (mode === "sentence" && !selectedSentenceCount) || (mode === "listening" && !selectedListeningCount) || (mode === "matching" && selectedMatchingCount < 7) || (mode === "crossword" && selectedCrosswordCount < count) || create.isPending} onClick={() => create.mutate([...selected])}>
              <span>{create.isPending ? "Формуємо маршрут…" : mode === "speech" ? "Почати вимову" : mode === "sentence" ? "Складати речення" : mode === "listening" ? "Почати слухати" : mode === "matching" ? "Знайти 7 пар" : "Створити кросворд"}</span>
              <b>→</b>
            </button>
            {create.error && <p className="launch-error">{create.error.message}</p>}
          </section>
        </section>
      </div>
    </div>
  );
}
