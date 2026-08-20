import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type TrainingCardProps = {
  accent: "red" | "green" | "gold";
  badge: string;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
  to?: string;
};

function progressLabel(value: number): string {
  return value > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
}

function topicsInLabel(value: number): string {
  return value % 10 === 1 && value % 100 !== 11 ? `${value} темі` : `${value} темах`;
}

function TrainingTypeCard({ accent, badge, description, eyebrow, icon, title, to }: TrainingCardProps) {
  const content = (
    <>
      <div className="training-type-topline"><span>{eyebrow}</span><small>{badge}</small></div>
      <div className="training-type-icon" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      <i className="training-type-divider" />
      <p>{description}</p>
      <span className="training-type-action">{to ? "Обрати" : "Незабаром"}<b>{to ? "→" : "·"}</b></span>
    </>
  );

  return to ? (
    <Link className={`training-type-card accent-${accent} available`} to={to}>{content}</Link>
  ) : (
    <article className={`training-type-card accent-${accent} planned`} aria-disabled="true">{content}</article>
  );
}

export function TrainingHubPage() {
  const topicsQuery = useQuery({ queryKey: ["training-topics"], queryFn: api.topics });
  const sentenceTopicsQuery = useQuery({ queryKey: ["sentence-topics"], queryFn: api.sentenceTopics });
  const listeningTopicsQuery = useQuery({ queryKey: ["listening-topics"], queryFn: api.listeningTopics });
  const matchingTopicsQuery = useQuery({ queryKey: ["matching-topics"], queryFn: api.matchingTopics });
  const crosswordTopicsQuery = useQuery({ queryKey: ["crossword-topics"], queryFn: api.crosswordTopics });
  const readingStatsQuery = useQuery({ queryKey: ["reading-stats"], queryFn: api.readingStats });
  const topics = topicsQuery.data ?? [];
  const sentenceTopics = sentenceTopicsQuery.data ?? {};
  const listeningTopics = listeningTopicsQuery.data ?? {};
  const totalWords = topics.reduce((sum, topic) => sum + topic.word_count, 0);
  const reviewedWords = topics.reduce((sum, topic) => sum + topic.reviewed_count, 0);
  const masteredWords = topics.reduce((sum, topic) => sum + topic.mastered_count, 0);
  const overallMastery = totalWords
    ? topics.reduce((sum, topic) => sum + topic.mastery_percent * topic.word_count, 0) / totalWords
    : 0;
  const sentenceCount = Object.values(sentenceTopics).reduce((sum, count) => sum + count, 0);
  const sentenceTopicCount = Object.values(sentenceTopics).filter((count) => count > 0).length;
  const listeningCount = Object.values(listeningTopics).reduce((sum, count) => sum + count, 0);
  const matchingCount = Object.values(matchingTopicsQuery.data ?? {}).reduce((sum, count) => sum + count, 0);
  const crosswordCount = Object.values(crosswordTopicsQuery.data ?? {}).reduce((sum, count) => sum + count, 0);
  const readingCount = readingStatsQuery.data?.total_texts ?? 0;

  return (
    <div className="training-hub">
      <div className="hub-shell shell">
        <header className="hub-heading">
          <div className="hub-heading-copy">
            <span className="luxury-kicker"><i /> IL TUO ALLENAMENTO</span>
            <h1>Scegli il tuo <em>allenamento.</em></h1>
            <p>Обери формат тренування, а потім тему й тривалість сесії.</p>
          </div>

          <aside className="hub-progress-card" aria-label={`Загальний прогрес ${progressLabel(overallMastery)}%`}>
            <div className="italian-stripe" aria-hidden="true"><i /><i /><i /></div>
            <div className="overview-ring" style={{ "--overall": `${overallMastery * 3.6}deg` } as CSSProperties}>
              <strong>{topicsQuery.isPending ? "—" : `${progressLabel(overallMastery)}%`}</strong>
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

        <section className="training-type-section" aria-labelledby="training-types-title">
          <div className="training-type-title">
            <div><small>ALLENAMENTI</small><h2 id="training-types-title">Тип тренування</h2></div>
            <span><b>7</b> форматів доступні зараз</span>
          </div>

          <div className="training-type-grid">
            <TrainingTypeCard
              accent="green"
              badge="10 карток"
              description="Один цілісний урок: переклад, слухання, вимова, речення й пари в природному перемішаному ритмі."
              eyebrow="LEZIONE MISTA"
              icon={<span className="token-icon"><i>IT</i><i>✦</i></span>}
              title="Змішаний урок"
              to="/training/setup/mixed"
            />
            <TrainingTypeCard
              accent="red"
              badge={`${matchingCount || "—"} слів`}
              description="Зіставляй сім італійських слів із перекладами та одразу слухай правильну вимову."
              eyebrow="ABBINA"
              icon={<span className="token-icon"><i>IT</i><i>UA</i></span>}
              title="Знайди пару"
              to="/training/setup/matching"
            />
            <TrainingTypeCard
              accent="red"
              badge={`${totalWords || "—"} слів`}
              description="Слухай носія, вимовляй слово в мікрофон і отримуй детальний зворотний зв’язок."
              eyebrow="PRONUNCIA"
              icon={<span className="wave-icon"><i /><i /><i /><i /><i /></span>}
              title="Вимова"
              to="/training/setup/speech"
            />
            <TrainingTypeCard
              accent="green"
              badge={`${sentenceCount || "—"} вправ`}
              description="Перекладай українські фрази, складаючи італійське речення зі слів та відкидаючи зайві."
              eyebrow="FRASI"
              icon={<span className="token-icon"><i>Io</i><i>sono</i></span>}
              title="Складання речень"
              to="/training/setup/sentence"
            />
            <TrainingTypeCard
              accent="gold"
              badge={`${listeningCount || "—"} аудіо`}
              description="Слухай слова без підказки й обирай правильний переклад або італійське написання."
              eyebrow="ASCOLTO"
              icon={<span className="listen-icon">◖<i>)))</i></span>}
              title="Сприйняття на слух"
              to="/training/setup/listening"
            />
            <TrainingTypeCard
              accent="green"
              badge={`${readingCount || "—"} текстів`}
              description="Читайте короткі історії, відкривайте переклад слів і відповідайте на питання за змістом."
              eyebrow="LETTURA"
              icon={<span className="letter-icon">Aa</span>}
              title="Читання"
              to="/reading"
            />
            <TrainingTypeCard
              accent="gold"
              badge={`${crosswordCount || "—"} слів`}
              description="Відновлюй написання італійських слів за українськими підказками у зв’язній сітці."
              eyebrow="CRUCIVERBA"
              icon={<span className="crossword-icon"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span>}
              title="Кросворд"
              to="/training/setup/crossword"
            />
            <TrainingTypeCard
              accent="gold"
              badge="У планах"
              description="Пиши слова й короткі фрази італійською та закріплюй правильне написання."
              eyebrow="SCRITTURA"
              icon={<span className="letter-icon">✎</span>}
              title="Письмо"
            />
          </div>
        </section>

        <section className="hub-facts" aria-label="Доступні навчальні матеріали">
          <div><small>СЛОВНИК</small><strong>{totalWords || "—"}</strong><span>слів A0–A2 у {topics.length ? topicsInLabel(topics.length) : "—"}</span></div>
          <div><small>РЕЧЕННЯ</small><strong>{sentenceCount || "—"}</strong><span>вправ у {sentenceTopicCount ? topicsInLabel(sentenceTopicCount) : "—"}</span></div>
          <p><em>Un passo alla volta.</em><span>Один крок за раз — у власному темпі.</span></p>
        </section>
      </div>
    </div>
  );
}
