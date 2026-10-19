import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { CurriculumLesson } from "../types";
import { PageHeading } from "../components/PageHeading";
import { LearningJourney } from "../components/LearningJourney";

export function reviewDue(lesson: CurriculumLesson): boolean {
  return Boolean(lesson.progress.next_review_at && new Date(lesson.progress.next_review_at).getTime() <= Date.now());
}

export function reviewDate(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" }).format(new Date(value));
}

export function LearningRecommendation() {
  const query = useQuery({ queryKey: ["curriculum"], queryFn: api.curriculum });
  const lesson = query.data?.lessons.find((item) => item.id === query.data?.recommended_lesson_id);
  return <section className="learning-banner">
    <span className="lesson-next-icon" aria-hidden="true">→</span>
    <div><span className="learning-next-label">{lesson?.active_session_id ? "Продовжити навчання" : query.data?.recommended_action === "review" ? "Час повторити" : query.data?.recommended_action === "practice" ? "Закріпити пройдене" : "Наступний урок"}</span>
      <h2>{lesson?.title ?? "Твій навчальний маршрут"}</h2>
    </div>
    <Link className="ui-button" to="/learn">{lesson?.active_session_id ? "Продовжити" : "До уроків"}<span aria-hidden="true">→</span></Link>
  </section>;
}

export function LearningPage() {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["curriculum"], queryFn: api.curriculum });
  const start = useMutation({
    mutationFn: ({ lesson, mode }: { lesson: CurriculumLesson; mode: "lesson" | "review" }) => api.createLesson(lesson.id, mode),
    onSuccess: (session) => navigate(`/learn/sessions/${session.id}`),
  });
  if (query.isPending) return <div className="state-page">Завантажуємо навчальний маршрут…</div>;
  if (query.isError) return <div className="state-page"><p>{query.error.message}</p><button className="primary" onClick={() => void query.refetch()}>Спробувати ще раз</button></div>;
  const catalog = query.data;
  const next = catalog.lessons.find((lesson) => lesson.id === catalog.recommended_lesson_id);
  const launch = (lesson: CurriculumLesson) => {
    if (lesson.active_session_id) navigate(`/learn/sessions/${lesson.active_session_id}`);
    else start.mutate({ lesson, mode: reviewDue(lesson) ? "review" : "lesson" });
  };
  return <div className="learning-page roadmap-page shell">
    <PageHeading title="Уроки" description={`Пройдено ${catalog.summary.completed_lessons} із ${catalog.summary.total_lessons}`}
      aside={next && <button className="ui-button journey-resume" disabled={start.isPending || !next.available} onClick={() => launch(next)} title={next.title}
        aria-label={`${catalog.recommended_action === "continue" ? "Продовжити" : catalog.recommended_action === "review" ? "Повторити" : catalog.recommended_action === "practice" ? "Закріпити" : "До уроку"}: ${next.title}`}>
        {start.isPending ? "Відкриваємо…" : catalog.recommended_action === "continue" ? "Продовжити" : catalog.recommended_action === "review" ? "Повторити" : catalog.recommended_action === "practice" ? "Закріпити" : "До уроку"}<span aria-hidden="true">→</span>
      </button>} />
    <LearningJourney units={catalog.units} lessons={catalog.lessons} nextLessonId={catalog.recommended_lesson_id}
      launching={start.isPending} error={start.isError ? start.error.message : undefined} onLaunch={launch} />
    {start.isError && <p role="alert" className="mixed-error">{start.error.message}</p>}
  </div>;
}
