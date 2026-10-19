import { useState } from "react";
import type { ProgressSnapshot } from "../../types";
import { progressMilestones, type CourseSummary } from "./progressVisuals";

export function ProgressConstellation({ data, course }: { data: ProgressSnapshot; course: CourseSummary }) {
  const milestones = progressMilestones(data, course);
  const [selected, setSelected] = useState("first");
  const current = milestones.find((item) => item.id === selected)!;
  return <section className="progress-section constellation-panel" aria-labelledby="constellation-title">
    <header><div><span className="observatory-eyebrow">ТВОЄ СУЗІР’Я</span><h2 id="constellation-title">Зірки, які ти запалюєш</h2></div><span className="constellation-count">{milestones.filter((item) => item.earned).length}<span> / {milestones.length} досягнень</span></span></header>
    <div className="constellation-stars" role="group" aria-label="Досягнення: обери зірку, щоб дізнатися умову">
      <svg className="constellation-links" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true"><path d="M83 60L250 60L417 60L583 60L750 60L917 60" fill="none" stroke="#c5b17b" strokeOpacity=".23" strokeDasharray="3 7"/></svg>
      {milestones.map((item, index) => <button key={item.id} className={`constellation-star ${item.earned ? "is-earned" : "is-locked"}`} aria-label={`${item.title}: ${item.earned ? "здобуто" : "попереду"}`} aria-pressed={selected === item.id} aria-controls="constellation-detail" onClick={() => setSelected(item.id)}>
        <span className="star-medal"><span>{item.mark}</span><i>{item.earned ? "✓" : String(index + 1).padStart(2, "0")}</i></span><b>{item.title}</b><small>{item.earned ? "Здобуто" : "Попереду"}</small>
      </button>)}
    </div>
    <div className={`constellation-detail ${current.earned ? "is-earned" : ""}`} id="constellation-detail" aria-live="polite" aria-atomic="true"><span className="constellation-detail-mark" aria-hidden="true">{current.mark}</span><div><strong>{current.title} <span>· {current.earned ? "Досягнення здобуто" : "Наступна іскра"}</span></strong><p>{current.detail}</p></div><span className="constellation-fraction">{current.value === null ? "Завантажуємо…" : current.earned ? "✦" : `${current.value} / ${current.target}`}</span></div>
  </section>;
}
