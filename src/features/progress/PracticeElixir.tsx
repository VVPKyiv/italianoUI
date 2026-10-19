import type { ProgressSnapshot } from "../../types";
import type { CourseSummary } from "./progressVisuals";
import { ElixirVessel } from "./ElixirVessel";
import { useDailyPractice } from "../daily-practice/DailyPracticeProvider";

export function PracticeElixir({ data, course, onShowWords }: { data: ProgressSnapshot; course: CourseSummary; onShowWords: () => void }) {
  const { goal, unavailable } = useDailyPractice();
  const fraction = goal?.fraction ?? 0;
  return <section className="practice-elixir" aria-labelledby="elixir-title">
    <div className="elixir-copy">
      <span className="observatory-eyebrow">LA TUA ALCHIMIA · СЬОГОДНІ</span>
      <h2 id="elixir-title">Новий день.<br/>{" "}<span>Нова крапля магії.</span></h2>
      <p>Навчайся у своєму ритмі. Твій еліксир наповнюється від сьогоднішньої практики на всіх сторінках.</p>
      <div className="elixir-word-count"><strong>{goal ? `${Math.round(fraction * 100)}%` : "—"}</strong><span>{goal?.complete ? "Денну ціль досягнуто" : "денного еліксиру"}<small>{goal ? `Сьогодні · ${goal.date.split("-").reverse().join(".")}` : unavailable ? "Не вдалося оновити дані. Перевір зв’язок." : "Завантажуємо сьогоднішню практику…"}</small></span></div>
      <div className="elixir-goal"><span>{goal?.complete ? "Денну ціль виконано" : "Одна з чотирьох доріг до цілі"}</span><b>{goal?.complete ? "✓" : "Щодня спочатку"}</b></div>
      <div className="elixir-meter" role="progressbar" aria-label="Денний еліксир" aria-valuenow={goal ? Math.round(fraction * 100) : undefined} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${fraction * 100}%` }}/></div>
      <small className="elixir-explanation">{goal?.complete ? "Еліксир сяятиме до кінця дня. Можна продовжувати навчання — усі результати зберігаються." : "Достатньо виконати одну з умов денної цілі. Лічильники відповідей, речень, читання й часу — у супутнику."} Новий цикл — опівночі за Києвом.</small>
      <button className="elixir-vocabulary-link" onClick={onShowWords}>Словник · {data.overview.reviewed_words} / {data.overview.total_words} слів у практиці ↗</button>
    </div>
    <div className={`elixir-art ${fraction ? "has-elixir" : ""}`}>
      <span className="elixir-art-label">Еліксир практики</span>
      <ElixirVessel fraction={fraction} active={fraction > 0}/>
      <span className="elixir-seal"><i/> {goal?.complete ? "Сьогоднішня магія вже з тобою" : "Твій супутник на кожній сторінці"}</span>
    </div>
    <div className="atelier-stats">
      <div><span className="atelier-stat-icon">↗</span><div><strong>{course ? `${course.completed_lessons}/${course.total_lessons}` : "—"}</strong><span>уроків пройдено</span></div></div>
      <div><span className="atelier-stat-icon">◇</span><div><strong>{course?.independent_lessons ?? "—"}</strong><span>самостійно · {course?.confirmed_lessons ?? "—"} після паузи</span></div></div>
      <div><span className="atelier-stat-icon">↻</span><div><strong>{data.overview.due_words}</strong><span>слів до повторення</span></div></div>
      <div><span className="atelier-stat-icon">♨</span><div><strong>{data.overview.current_streak}<small> дн.</small></strong><span>серія · рекорд {data.overview.longest_streak}</span></div></div>
    </div>
  </section>;
}
