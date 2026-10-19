import { useId, useState } from "react";
import type { ProgressActivityDay } from "../../types";
import { activitySummary } from "./progressVisuals";

const dateLabel = (date: string, long = false) => new Intl.DateTimeFormat("uk-UA", {
  day: "numeric", month: long ? "long" : "short",
}).format(new Date(`${date}T12:00:00`));

export function ActivityPulse({ days }: { days: ProgressActivityDay[] }) {
  const id = useId().replace(/:/g, "");
  const [metric, setMetric] = useState<"attempts" | "minutes">("attempts");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const lastActive = days.reduce((last, day, index) => day.attempts > 0 || day.minutes > 0 ? index : last, -1);
  const explicitIndex = days.findIndex((day) => day.date === selectedDate);
  const selected = explicitIndex >= 0 ? explicitIndex : Math.max(0, lastActive >= 0 ? lastActive : days.length - 1);
  const summary = activitySummary(days);
  const max = Math.max(1, ...days.map((day) => day[metric]));
  const points = days.map((day, index) => ({ x: 28 + index / Math.max(1, days.length - 1) * 664, y: 194 - day[metric] / max * 148 }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedDay = days[selected];
  const selectedPoint = points[selected];
  const move = (delta: number) => setSelectedDate(days[Math.max(0, Math.min(days.length - 1, selected + delta))]?.date ?? null);
  return <section className="progress-section pulse-panel" aria-labelledby="pulse-title">
    <header><div><span className="observatory-eyebrow">ОСТАННІ 30 ДНІВ</span><h2 id="pulse-title">Пульс навчання</h2></div><span className="pulse-live"><i/> Твій ритм</span></header>
    <div className="pulse-toolbar"><div className="pulse-total"><strong>{metric === "attempts" ? summary.attempts : summary.minutes}</strong><span>{metric === "attempts" ? "відповідей за 30 днів" : "хвилин за 30 днів"}</span></div>
      <div className="pulse-metrics" role="group" aria-label="Показник графіка"><button aria-pressed={metric === "attempts"} onClick={() => setMetric("attempts")}>Відповіді</button><button aria-pressed={metric === "minutes"} onClick={() => setMetric("minutes")}>Хвилини</button></div>
    </div>
    {days.length > 0 ? <>
      <div className="pulse-scale"><span>{metric === "attempts" ? "Відповіді за день" : "Хвилини за день"}</span><span>Пік: {Math.max(0, ...days.map((day) => day[metric]))}</span></div>
      <div className="pulse-plot" role="slider" tabIndex={0} aria-label="День на графіку активності" aria-valuemin={1} aria-valuemax={days.length} aria-valuenow={selected + 1}
        aria-valuetext={selectedDay ? `${dateLabel(selectedDay.date, true)}: ${selectedDay.attempts} відповідей, ${selectedDay.minutes} хвилин` : "Немає даних"}
        aria-describedby={`${id}-instructions`}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (event.key === "Home") setSelectedDate(days[0].date);
            else if (event.key === "End") setSelectedDate(days[days.length - 1].date);
            else move(["ArrowLeft", "ArrowDown"].includes(event.key) ? -1 : 1);
          }
        }}
        onPointerMove={(event) => { if (event.pointerType === "mouse") {
          const rect = event.currentTarget.getBoundingClientRect();
          const index = Math.round(((event.clientX - rect.left) / rect.width * 720 - 28) / 664 * (days.length - 1));
          setSelectedDate(days[Math.max(0, Math.min(days.length - 1, index))].date);
        } }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const index = Math.round(((event.clientX - rect.left) / rect.width * 720 - 28) / 664 * (days.length - 1));
          setSelectedDate(days[Math.max(0, Math.min(days.length - 1, index))].date);
        }}>
        <svg viewBox="0 0 720 204" aria-hidden="true">
          <defs><linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4af2c5" stopOpacity=".3"/><stop offset="1" stopColor="#4af2c5" stopOpacity="0"/></linearGradient>
            <linearGradient id={`${id}-line`}><stop stopColor="#257e6c"/><stop offset=".6" stopColor="#47dbb4"/><stop offset="1" stopColor="#e1d193"/></linearGradient>
            <filter id={`${id}-glow`} x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5"/></filter></defs>
          {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="28" x2="692" y1={194 - fraction * 148} y2={194 - fraction * 148} stroke="#a8cabc" strokeOpacity=".1" strokeDasharray="3 6"/></g>)}
          {points.length > 1 && <polygon points={`28,194 ${line} 692,194`} fill={`url(#${id}-area)`}/>}
          <polyline points={line} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          {days.map((day, index) => day[metric] > 0 && day[metric] >= (days[index - 1]?.[metric] ?? 0) && day[metric] >= (days[index + 1]?.[metric] ?? 0) ? <g className="pulse-peak" key={day.date}><circle {...{ cx: points[index].x, cy: points[index].y }} r="10" fill="#6fffd1" opacity=".6" filter={`url(#${id}-glow)`}/><circle cx={points[index].x} cy={points[index].y} r="3.5" fill="#d8ffe9"/></g> : null)}
          {selectedPoint && <g><line x1={selectedPoint.x} x2={selectedPoint.x} y1="28" y2="194" stroke="#e6cc94" strokeOpacity=".55" strokeDasharray="3 5"/>
            <circle cx={selectedPoint.x} cy={selectedPoint.y} r="6" fill="#0e2921" stroke="#e8cf9d" strokeWidth="2"/></g>}

        </svg>
      </div>
      <div className="pulse-axis" aria-hidden="true">{[0, Math.floor((days.length - 1) / 2), days.length - 1].map((index, position) => <span key={position}>{dateLabel(days[index].date)}</span>)}</div>
      <p className="pulse-instructions" id={`${id}-instructions`}>Торкнись графіка або обери день стрілками.</p>
      {selectedDay && <div className="pulse-day"><button aria-label="Попередній день" disabled={selected === 0} onClick={() => move(-1)}>←</button><div aria-live="polite" aria-atomic="true"><strong>{dateLabel(selectedDay.date, true)}</strong><span>{selectedDay.attempts} відповідей · {selectedDay.minutes} хв · {selectedDay.attempts ? `${Math.round(selectedDay.accuracy)}% точність` : "без відповідей"}</span></div><button aria-label="Наступний день" disabled={selected === days.length - 1} onClick={() => move(1)}>→</button></div>}
    </> : <p className="pulse-empty">Тут з’явиться твій ритм після першої практики.</p>}
    <footer className="pulse-footer"><span>Точність за період <b>{summary.accuracy === null ? "—" : `${summary.accuracy}%`}</b></span><details><summary>Дані за днями</summary><div className="pulse-table"><table><caption>Активність за останні 30 днів</caption><thead><tr><th>Дата</th><th>Відповіді</th><th>Хвилини</th><th>Точність</th></tr></thead><tbody>{days.map((day) => <tr key={day.date}><th scope="row">{dateLabel(day.date)}</th><td>{day.attempts}</td><td>{day.minutes}</td><td>{day.attempts ? `${Math.round(day.accuracy)}%` : "—"}</td></tr>)}</tbody></table></div></details></footer>
  </section>;
}
