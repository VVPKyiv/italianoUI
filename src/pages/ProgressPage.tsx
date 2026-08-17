import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

function percent(value: number): string {
  return value > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit" }).format(
    new Date(`${value}T12:00:00`),
  );
}

const skillMarks: Record<string, string> = {
  vocabulary: "Aa",
  pronunciation: "≋",
  listening: "◖",
  sentences: "Fr",
  reading: "Le",
};

export function ProgressPage() {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const progressQuery = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  const data = progressQuery.data;

  if (progressQuery.isPending) return <div className="state-page progress-state">Збираємо чесну статистику…</div>;
  if (!data) return <div className="state-page progress-state">Не вдалося завантажити прогрес</div>;

  const maxAttempts = Math.max(1, ...data.activity.map((item) => item.attempts));
  const overview = data.overview;
  const visibleTopics = showAllTopics
    ? data.topics
    : data.topics.filter((topic) => topic.attempts || topic.reviewed_words).slice(0, 6);

  return (
    <div className="progress-page shell">
      <header className="progress-hero">
        <div>
          <span className="luxury-kicker"><i /> IL TUO PERCORSO</span>
          <h1>Твій реальний <em>прогрес.</em></h1>
          <p>Без умовних XP: актуальна вивченість, точність і регулярність практики. Загальний бал враховує ширину словника та обсяг спроб.</p>
        </div>
        <div className="progress-main-score">
          <div className="progress-score-ring" style={{ "--score": `${overview.overall_score * 3.6}deg` } as CSSProperties}>
            <strong>{percent(overview.overall_score)}%</strong><small>загалом</small>
          </div>
          <div><span>PROGRESSO COMPLESSIVO</span><b>{overview.reviewed_words} з {overview.total_words} слів розпочато</b><small>{overview.mastered_words} уже тримаються вище 60%</small></div>
        </div>
      </header>

      <section className="progress-kpis" aria-label="Ключові показники">
        <article className="streak"><small>СЕРІЯ ДНІВ</small><strong>{overview.current_streak}</strong><span>найдовша: {overview.longest_streak}</span></article>
        <article><small>ДО ПОВТОРЕННЯ</small><strong>{overview.due_words}</strong><span>слів нижче 60%</span></article>
        <article><small>ЧАС НАВЧАННЯ</small><strong>{overview.study_minutes}</strong><span>хвилин у завершених сесіях</span></article>
        <article><small>АКТИВНІ ДНІ</small><strong>{overview.active_days}</strong><span>днів із корисною практикою</span></article>
      </section>

      <section className="progress-section skill-profile">
        <header><div><small>PROFILO</small><h2>Профіль навичок</h2></div><p>Точність рахується з реальних перевірених відповідей.</p></header>
        <div className="skill-grid">
          {data.skills.map((skill) => (
            <Link key={skill.key} className={`skill-card skill-${skill.key}`} to={skill.route}>
              <span>{skillMarks[skill.key]}</span>
              <small>{skill.label}</small>
              <strong>{percent(skill.score)}%</strong>
              <i><b style={{ width: `${skill.score}%` }} /></i>
              <em>{skill.key === "vocabulary"
                ? (skill.attempts ? `${skill.correct}/${skill.attempts} упевнено засвоєно` : "Ще немає слів")
                : (skill.attempts ? `${skill.correct}/${skill.attempts} правильно` : "Ще немає спроб")}</em>
            </Link>
          ))}
        </div>
      </section>

      <div className="progress-two-column">
        <section className="progress-section activity-panel">
          <header><div><small>ULTIMI 30 GIORNI</small><h2>Активність</h2></div><span><i /> день зараховано</span></header>
          <div className="activity-chart" aria-label="Активність за останні 30 днів">
            {data.activity.map((day) => (
              <div key={day.date} className={day.qualified ? "qualified" : ""} title={`${day.date}: ${day.attempts} вправ`}>
                <span><i style={{ height: `${Math.max(day.attempts ? 8 : 2, day.attempts / maxAttempts * 100)}%` }} /></span>
                <small>{shortDate(day.date)}</small>
              </div>
            ))}
          </div>
          <footer><span>За 30 днів: <b>{data.activity.reduce((sum, item) => sum + item.attempts, 0)}</b> відповідей</span><span>Точність: <b>{percent(data.activity.reduce((sum, item) => sum + item.correct, 0) / Math.max(1, data.activity.reduce((sum, item) => sum + item.attempts, 0)) * 100)}%</b></span></footer>
        </section>

        <section className="progress-section reading-progress-card">
          <header><div><small>LETTURA</small><h2>Читання</h2></div><Link to="/reading">До текстів →</Link></header>
          <div className="reading-progress-big"><strong>{data.reading.completed_texts}/{data.reading.total_texts}</strong><span>унікальних текстів завершено</span></div>
          <dl>
            <div><dt>Розуміння</dt><dd>{percent(data.reading.accuracy)}%</dd></div>
            <div><dt>Відповідей</dt><dd>{data.reading.questions_answered}</dd></div>
            <div><dt>Відкрито нових слів</dt><dd>{data.reading.unique_words_opened}</dd></div>
            <div><dt>Прослуховувань</dt><dd>{data.reading.audio_plays}</dd></div>
          </dl>
        </section>
      </div>

      {data.recommendations.length > 0 && (
        <section className="progress-section recommendations">
          <header><div><small>PROSSIMO PASSO</small><h2>Що робити далі</h2></div></header>
          <div>{data.recommendations.map((item) => (
            <Link key={item.title} className={`recommendation accent-${item.accent}`} to={item.route}>
              <i /><span><b>{item.category ? `Підсилити тему «${presentationFor(item.category).title}»` : item.title}</b><small>{item.description}</small></span><strong>→</strong>
            </Link>
          ))}</div>
        </section>
      )}

      <section className="progress-section topic-statistics">
        <header><div><small>ARGOMENTI</small><h2>Прогрес за темами</h2></div><p>Загальний бал об’єднує тільки ті навички, які ви вже тренували.</p></header>
        <div className="topic-stat-grid">
          {visibleTopics.map((topic) => {
            const view = presentationFor(topic.category);
            return (
              <article key={topic.category} className={`topic-stat-card accent-${view.accent}`}>
                <header><span>{view.mark}</span><div><small>{view.italian}</small><h3>{view.title}</h3></div><strong>{percent(topic.overall_score)}%</strong></header>
                <div className="topic-stat-mastery"><span>Словник: {topic.reviewed_words}/{topic.word_count}</span><b>{percent(topic.mastery)}%</b></div>
                <i className="topic-stat-bar"><b style={{ width: `${topic.overall_score}%` }} /></i>
                <dl>
                  <div><dt>Вимова</dt><dd>{percent(topic.skills.pronunciation)}%</dd></div>
                  <div><dt>Слух</dt><dd>{percent(topic.skills.listening)}%</dd></div>
                  <div><dt>Речення</dt><dd>{percent(topic.skills.sentences)}%</dd></div>
                  <div><dt>Читання</dt><dd>{percent(topic.skills.reading)}%</dd></div>
                </dl>
                <Link to={`/training/setup/speech?category=${topic.category}`}>Тренувати тему <b>→</b></Link>
              </article>
            );
          })}
        </div>
        {data.topics.length > 6 && <button className="show-all-topics" onClick={() => setShowAllTopics((value) => !value)}>{showAllTopics ? "Показати основні теми" : `Показати всі теми · ${data.topics.length}`}</button>}
      </section>

      <section className="progress-section weak-words">
        <header><div><small>DA RIPETERE</small><h2>Слова, які варто повторити</h2></div><Link to="/training/setup/speech">Почати повторення →</Link></header>
        {data.weak_words.length ? <div className="weak-word-list">{data.weak_words.map((word) => (
          <article key={word.id}>
            <span className="weak-level">{word.cefr_level}</span>
            <div><b>{word.italian}</b><small>{word.ukrainian}</small></div>
            <span>{presentationFor(word.category).title}</span>
            <div className="weak-mastery"><i><b style={{ width: `${word.mastery}%` }} /></i><strong>{percent(word.mastery)}%</strong></div>
            <small>{word.failed_reviews} помилок</small>
          </article>
        ))}</div> : <p className="progress-empty">Ще немає слів для повторення — почніть перше тренування.</p>}
      </section>
    </div>
  );
}
