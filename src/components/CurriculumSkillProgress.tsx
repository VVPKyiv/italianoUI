import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function CurriculumSkillProgress() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["progress", "curriculum-insights"], queryFn: api.curriculumInsights });
  const practice = useMutation({ mutationFn: (lessonId: string) => api.createLesson(lessonId), onSuccess: (session) => navigate(`/learn/sessions/${session.id}`) });
  if (query.isPending) return <p role="status">Збираємо результати за навичками…</p>;
  if (!query.data) return <p role="alert">Результати навичок тимчасово недоступні.</p>;
  const data = query.data;
  return <section className="progress-section" aria-label="Навички навчального маршруту">
    <header><div><small>LE TUE ABILITÀ</small><h2>Навички в уроках</h2></div></header>
    <p>Показуємо фактичний спосіб відповіді. Письмо не зараховується як усне мовлення. «—» означає, що даних ще немає.</p>
    <div className="evidence-grid">{data.skills.map((skill) => <article key={skill.skill}>
      <h3>{skill.label}</h3><strong>{skill.first_accuracy === null ? "—" : `${skill.first_accuracy}%`}</strong>
      <span>{skill.first_correct} із {skill.first_unassisted} перших відповідей без підтримки</span>
      <dl><div><dt>Усього відповідей</dt><dd>{skill.attempts}</dd></div>
        <div><dt>З підказкою</dt><dd>{skill.supported}</dd></div>
        <div><dt>Контроль без підтримки</dt><dd>{skill.assessment_correct}/{skill.assessment_total}</dd></div>
        <div><dt>Нові ситуації без підтримки</dt><dd>{skill.transfer_independent}/{skill.transfer_total}</dd></div></dl>
    </article>)}</div>
    {data.recommendations.length > 0 && <div className="curriculum-practice-recommendations"><h3>Варто закріпити</h3>{data.recommendations.map((item) => <article key={item.lesson_id}>
      <strong>{item.title} · {item.label}</strong><p>{item.reason}</p><small>{item.errors} помилок · {item.supported} відповідей із підтримкою</small>
      <button className="secondary" disabled={practice.isPending} onClick={() => practice.mutate(item.lesson_id)}>До практики →</button>
    </article>)}</div>}
    {practice.error && <p role="alert">{practice.error.message}</p>}
    <details><summary>Навчальні цілі й конструкції</summary>{data.objectives.length === 0 ? <p>Результати з’являться після завдань із розміченими цілями.</p> : data.objectives.map((item) => <p key={`${item.lesson_id}-${item.objective}-${item.skill}`}><strong>{item.objective}</strong> · {item.label}<br />{item.constructions.join(" · ")}<br />{item.attempts} відповідей</p>)}</details>
    <details><summary>Як читати показники ефективності</summary><p>{data.interpretation}</p>
      <p>Розпочато сесій: {data.sessions.started}. Завершено: {data.sessions.completed}. Пауза понад добу: {data.sessions.paused_24h}.</p>
      <p>Збоїв розпізнавання, зафіксованих новим журналом: {data.technical_failures}. Вони не рахуються мовними помилками. Відмови доступу до мікрофона не потрапляють на сервер.</p>
      <p>Відповідей без нової розмітки цілей: {data.unannotated_answers}. Відкладені перевірки й пропущені вікна показані нижче.</p>
    </details>
  </section>;
}
