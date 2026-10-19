import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { PageHeading } from "../components/PageHeading";
import { TrainingFormatArtwork } from "../components/TrainingFormatArtwork";
import { LearningRecommendation } from "./LearningPage";

export function TrainingHubPage() {
  const topics = useQuery({ queryKey: ["training-topics"], queryFn: api.topics });
  const sentences = useQuery({ queryKey: ["sentence-topics"], queryFn: api.sentenceTopics });
  const listening = useQuery({ queryKey: ["listening-topics"], queryFn: api.listeningTopics });
  const matching = useQuery({ queryKey: ["matching-topics"], queryFn: api.matchingTopics });
  const crossword = useQuery({ queryKey: ["crossword-topics"], queryFn: api.crosswordTopics });
  const reading = useQuery({ queryKey: ["reading-stats"], queryFn: api.readingStats });
  const curriculum = useQuery({ queryKey: ["curriculum"], queryFn: api.curriculum });
  const course = curriculum.data?.summary;
  const totalWords = topics.data?.reduce((sum, topic) => sum + topic.word_count, 0);
  const reviewedWords = topics.data?.reduce((sum, topic) => sum + topic.reviewed_count, 0);
  const count = (values: Record<string, number> | undefined) => values ? Object.values(values).reduce((sum, value) => sum + value, 0) : "—";
  const formats = [
    { key: "mixed", title: "Змішаний урок", description: "Слова, слухання та речення в одному тренуванні.", badge: "10 карток", accent: "green", to: "/training/setup/mixed" },
    { key: "matching", title: "Знайди пару", description: "Зістав італійські слова з перекладами.", badge: `${count(matching.data)} слів`, accent: "red", to: "/training/setup/matching" },
    { key: "speech", title: "Вимова", description: "Слухай слово й вимовляй його в мікрофон.", badge: `${totalWords ?? "—"} слів`, accent: "red", to: "/training/setup/speech" },
    { key: "sentence", title: "Речення", description: "Складай італійські речення з готових слів.", badge: `${count(sentences.data)} вправ`, accent: "green", to: "/training/setup/sentence" },
    { key: "listening", title: "Аудіювання", description: "Слухай і обирай правильний переклад.", badge: `${count(listening.data)} аудіо`, accent: "gold", to: "/training/setup/listening" },
    { key: "reading", title: "Читання", description: "Читай короткі історії та відповідай на запитання.", badge: `${reading.data?.total_texts ?? "—"} текстів`, accent: "green", to: "/reading" },
    { key: "crossword", title: "Кросворд", description: "Вписуй слова за українськими підказками.", badge: `${count(crossword.data)} слів`, accent: "gold", to: "/training/setup/crossword" },
  ] as const;

  return <div className="training-hub">
    <div className="hub-shell shell">
      <PageHeading title="Тренування" description="Обери формат, тему та кількість вправ." aside={
        <div className="summary-panel" aria-label="Твій прогрес">
          <Link to="/progress#vocabulary-progress"><span>Слова в практиці</span><strong>{reviewedWords ?? "—"}<small> / {totalWords ?? "—"}</small></strong></Link>
          <Link to="/learn"><span>Пройдено уроків</span><strong>{course?.completed_lessons ?? "—"}<small> / {course?.total_lessons ?? "—"}</small></strong></Link>
        </div>
      } />
      <LearningRecommendation />
      <section className="format-section" aria-labelledby="training-types-title">
        <header className="section-heading"><h2 id="training-types-title">Обери тренування</h2><span>Рівні A0–A2</span></header>
        <div className="format-grid">
          {formats.map((format) => <Link className={`format-card accent-${format.accent}`} key={format.key} to={format.to}>
            <TrainingFormatArtwork kind={format.key} />
            <div className="format-card-top"><span className="ui-badge">{format.badge}</span></div>
            <h3>{format.title}</h3>
            <p>{format.description}</p>
            <span className="format-action">{format.key === "reading" ? "Обрати текст" : "Обрати тему"}<span aria-hidden="true">→</span></span>
          </Link>)}
          <Link className="format-card together-card" to="/multiplayer">
            <TrainingFormatArtwork kind="together" />
            <div className="format-card-top"><span className="ui-badge">2 гравці</span></div>
            <h3>Тренування разом</h3><p>Відкрий кімнату або приєднайся за кодом.</p><span className="format-action">Перейти до кімнат<span aria-hidden="true">→</span></span>
          </Link>
        </div>
      </section>
    </div>
  </div>;
}
