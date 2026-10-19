import { PageHeading } from "../components/PageHeading";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PracticeElixir } from "../features/progress/PracticeElixir";
import { ActivityPulse } from "../features/progress/ActivityPulse";
import { ProgressConstellation } from "../features/progress/ProgressConstellation";
import { ReadingShelf } from "../features/progress/ReadingShelf";
import { Link } from "react-router-dom";
import { CurriculumSkillProgress } from "../components/CurriculumSkillProgress";
import { api } from "../api/client";
import { presentationFor } from "../content/topics";

function percent(value: number): string {
  return value > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
}

const skillMarks: Record<string, string> = {
  vocabulary: "Aa",
  pronunciation: "≋",
  listening: "◖",
  sentences: "Fr",
  reading: "Le",
};

export function ProgressPage() {
  const [view, setView] = useState<"overview" | "skills" | "history">(() => window.location.hash === "#vocabulary-progress" ? "skills" : "overview");
  const [effects, setEffects] = useState(true);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const progressQuery = useQuery({ queryKey: ["progress"], queryFn: api.progress });
  const courseQuery = useQuery({ queryKey: ["curriculum"], queryFn: api.curriculum });
  const course = courseQuery.data?.summary;
  const data = progressQuery.data;

  if (progressQuery.isPending) return <div className="state-page progress-state">Завантажуємо прогрес…</div>;
  if (!data) return <div className="state-page progress-state">Не вдалося завантажити прогрес</div>;

  const overview = data.overview;
  const visibleTopics = showAllTopics
    ? data.topics
    : data.topics.filter((topic) => topic.attempts || topic.reviewed_words).slice(0, 6);

  return (
    <div className="progress-page shell" data-view={view} data-effects={effects ? "on" : "off"}>
      <PageHeading title="Прогрес" description="Твоя історія навчання — у словах, кроках і маленьких перемогах." aside={
        <Link className="ui-button secondary" to="/learn">До навчання<span aria-hidden="true">→</span></Link>
      } />
      {view === "overview" && <PracticeElixir data={data} course={course} onShowWords={() => setView("skills")} />}
      {view !== "overview" && <section className="progress-kpis" aria-label="Ключові показники">
        <article><small>Пройдено уроків</small><strong>{course ? `${course.completed_lessons}/${course.total_lessons}` : "—"}</strong><span>у навчальному маршруті</span></article>
        <article><small>Самостійно</small><strong>{course?.independent_lessons ?? "—"}</strong><span>{course?.confirmed_lessons ?? "—"} підтверджено після паузи</span></article>
        <article><small>До повторення</small><strong>{overview.due_words}</strong><span>слів для пригадування</span></article>
        <article><small>Серія днів</small><strong>{overview.current_streak}</strong><span>найдовша: {overview.longest_streak}</span></article>
      </section>}
      <div className="progress-view-controls">
      <div className="ui-segmented progress-navigation" role="group" aria-label="Розділи прогресу">
        {([['overview', 'Огляд'], ['skills', 'Навички'], ['history', 'Історія']] as const).map(([value, title]) =>
          <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{title}</button>)}
      </div>
      <button className="observatory-effects" aria-pressed={effects} onClick={() => setEffects((value) => !value)}><span aria-hidden="true">✧</span> Ефекти: {effects ? "увімкнено" : "вимкнено"}</button>
      </div>
      {view === "history" && <div className="ui-panel practice-history-summary"><span><b>{overview.study_minutes}</b> хв навчання</span><span><b>{overview.active_days}</b> активних днів</span><span><b>{data.evidence.dimensions.reduce((sum, item) => sum + item.attempts, 0)}</b> відповідей</span></div>}
      {view === "skills" && <CurriculumSkillProgress />}

      <section className="progress-section evidence-profile progress-skills-content">
        <header><div><small>COME RICORDI</small><h2>Що саме перевірено</h2></div></header>
        <p>Точність першої відповіді рахуємо до підказок і виправлень. Письмова відповідь та усна відповідь мають окремі результати.</p>
        <div className="evidence-grid">
          {data.evidence.dimensions.map((item) => (
            <article key={item.kind}>
              <h3>{item.label}</h3>
              <strong>{item.first_accuracy === null ? "—" : `${percent(item.first_accuracy)}%`}</strong>
              <span>{item.first_attempts ? `${item.first_correct} із ${item.first_attempts} перших відповідей без підказки` : "Ще немає перших відповідей без підказки"}</span>
              <dl>
                <div><dt>Усього спроб</dt><dd>{item.attempts}</dd></div>
                <div><dt>З підтримкою</dt><dd>{item.supported_attempts}</dd></div>
                <div><dt>Успішних виправлень</dt><dd>{item.corrected_attempts}</dd></div>
                {(item.kind === "spoken_recall" || item.kind === "written_recall") && <>
                  <div><dt>Слів відтворено самостійно</dt><dd>{item.independent_words}</dd></div>
                  <div><dt>Слів підтверджено після паузи</dt><dd>{item.confirmed_words}</dd></div>
                </>}
              </dl>
            </article>
          ))}
        </div>
        <p>Лічильники слів стосуються словникових вправ. Результат побутової задачі та повторення уроку дивіться в <Link to="/learn">навчальному маршруті</Link>. Усна перевірка зіставляє розпізнаний текст з відповіддю; фонетичну якість вона не оцінює.</p>
        {data.evidence.legacy_attempts > 0 && <p>Попередні {data.evidence.legacy_attempts} відповідей залишилися в історії активності. Даних про підтримку недостатньо, щоб зарахувати їх як самостійне пригадування.</p>}
      </section>

      <section className="progress-section review-history progress-history-content">
        <header><div><small>DOPO UNA PAUSA</small><h2>Відкладені перевірки</h2></div><Link to="/learn">До повторення →</Link></header>
        <div className="review-summary">
          <article><small>Призначено</small><strong>{data.reviews.totals.planned}</strong></article>
          <article><small>Завершено</small><strong>{data.reviews.totals.completed}</strong></article>
          <article><small>Доступно зараз</small><strong>{data.reviews.totals.available}</strong></article>
          <article><small>Пропущено вікно</small><strong>{data.reviews.totals.missed}</strong></article>
        </div>
        <p>Вікно перевірки триває {data.reviews.window_hours} години від призначеного часу. Показник пропусків рахує незавершені перевірки після цього вікна; вони залишаються доступними. Відсутність відповіді не рахуємо як помилку.</p>
        <div className="review-table-wrap">
          <table className="review-table">
            <caption>Результати за запланованою паузою</caption>
            <thead><tr><th scope="col">Пауза</th><th scope="col">Повернення до перевірки</th><th scope="col">Самостійний успіх</th><th scope="col">Фактична пауза</th><th scope="col">Пропущено вікно</th></tr></thead>
            <tbody>{data.reviews.cohorts.map((row) => (
              <tr key={row.interval_days ?? "legacy"}>
                <th scope="row">{row.interval_days === null ? "Історичний термін" : `${row.interval_days} дн.`}</th>
                <td>{row.completion_rate === null ? "—" : `${percent(row.completion_rate)}%`}<small>{row.eligible_completed}/{row.eligible_due} доступних після самостійного результату</small></td>
                <td>{row.success_rate === null ? "—" : `${percent(row.success_rate)}%`}<small>{row.independent_success} самостійних із {row.eligible_completed} завершених</small></td>
                <td>{row.actual_pause_days === null ? "—" : `${row.actual_pause_days} дн.`}<small>{row.late_completed} завершено після вікна</small></td>
                <td>{row.missed}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <p>Самостійний успіх рахуємо серед завершених перевірок після попереднього самостійного результату. Показуємо кількість спроб і реальну середню паузу: повернення пізніше не означає перевірку точно на запланований день.</p>
        <p>Ще попереду: {data.reviews.totals.upcoming}. Замінено новим призначенням після практики: {data.reviews.totals.superseded}. Відкриті призначення попередніх або недоступних версій: {data.reviews.totals.inactive}.</p>
      </section>

      <section className="progress-section lesson-activity progress-history-content">
        <header><div><small>IL PERCORSO</small><h2>Проходження уроків</h2></div></header>
        <div className="review-summary">
          <article><small>Розпочато сесій</small><strong>{data.lesson_activity.started}</strong></article>
          <article><small>Завершено</small><strong>{data.lesson_activity.completed}</strong></article>
          <article><small>Незавершені</small><strong>{data.lesson_activity.open}</strong></article>
          <article><small>Без записаних дій понад добу</small><strong>{data.lesson_activity.paused}</strong></article>
        </div>
        <p>Пауза означає відсутність зафіксованих навчальних дій понад добу. Це орієнтир для продовження, а не доказ, що учень покинув урок.</p>
        {data.lesson_activity.stalled_steps.length > 0 ? <ul className="stalled-step-list">{data.lesson_activity.stalled_steps.map((step) => (
          <li key={`${step.lesson_id}:${step.version}:${step.step_id}`}>
            <div><strong>{step.title}</strong><span>{step.phase === "assessment" ? "Самостійна перевірка" : step.phase === "practice" ? "Практика" : "Пояснення"}: {step.prompt}</span></div>
            <small>{step.sessions} незавершених сесій</small>
          </li>
        ))}</ul> : <p>Немає незавершених сесій без зафіксованих навчальних дій понад добу.</p>}
      </section>

      <section id="vocabulary-progress" className="progress-section skill-profile progress-skills-content">
        <header><div><small>PROFILO</small><h2>Практика за форматами</h2></div><p>Точність за всі спроби. Прогрес слів враховує результати уроків і тренувань.</p></header>
        <div className="skill-grid">
          {data.skills.map((skill) => (
            <Link key={skill.key} className={`skill-card skill-${skill.key}`} to={skill.route}>
              <span>{skillMarks[skill.key]}</span>
              <small>{skill.label}</small>
              <strong>{percent(skill.score)}%</strong>
              <i><b style={{ width: `${skill.score}%` }} /></i>
              <em>{skill.key === "vocabulary"
                ? (skill.attempts ? `${skill.correct}/${skill.attempts} вище порогу повторення` : "Ще немає слів")
                : (skill.attempts ? `${skill.correct}/${skill.attempts} правильно` : "Ще немає спроб")}</em>
            </Link>
          ))}
        </div>
      </section>

      {view === "overview" && <>
        <div className="observatory-grid">
          <ActivityPulse days={data.activity} />
          <ReadingShelf reading={data.reading} />
        </div>
        <ProgressConstellation data={data} course={course} />
      </>}

      {data.recommendations.length > 0 && (
        <section className="progress-section recommendations progress-overview-content">
          <header><div><small>PROSSIMO PASSO</small><h2>Що робити далі</h2></div></header>
          <div>{data.recommendations.map((item) => (
            <Link key={item.title} className={`recommendation accent-${item.accent}`} to={item.route}>
              <i /><span><b>{item.category ? `Підсилити тему «${presentationFor(item.category).title}»` : item.title}</b><small>{item.description}</small></span><strong>→</strong>
            </Link>
          ))}</div>
        </section>
      )}

      <section className="progress-section topic-statistics progress-skills-content">
        <header><div><small>ARGOMENTI</small><h2>Прогрес за темами</h2></div><p>Комбінований індекс практики за темою; це не оцінка рівня мови.</p></header>
        <div className="topic-stat-grid">
          {visibleTopics.map((topic) => {
            const view = presentationFor(topic.category);
            return (
              <article key={topic.category} className={`topic-stat-card accent-${view.accent}`}>
                <header><span>{view.mark}</span><div><small>{view.italian}</small><h3>{view.title}</h3></div><strong>{percent(topic.overall_score)}%</strong></header>
                <div className="topic-stat-mastery"><span>Усне пригадування: {topic.reviewed_words}/{topic.word_count}</span><b>{percent(topic.mastery)}%</b></div>
                <i className="topic-stat-bar"><b style={{ width: `${topic.overall_score}%` }} /></i>
                <dl>
                  <div><dt>Усна відповідь</dt><dd>{percent(topic.skills.pronunciation)}%</dd></div>
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

      <section className="progress-section weak-words progress-overview-content">
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
