import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ElixirVessel } from "../progress/ElixirVessel";
import { useDailyPractice } from "./DailyPracticeProvider";
import { clampCompanion, goalTransition } from "./companionState";

function getPreference(profileId: string, key: string) {
  try { return localStorage.getItem(`italiano:companion:${profileId}:${key}`) === "true"; } catch { return false; }
}

function Companion({ profileId }: { profileId: string }) {
  const { goal, unavailable, refresh } = useDailyPractice();
  const id = useId();
  const [folded, setFolded] = useState(() => getPreference(profileId, "folded"));
  const [quiet, setQuiet] = useState(() => getPreference(profileId, "quiet"));
  const [open, setOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [position, setPosition] = useState(() => clampCompanion({ x: window.innerWidth - 144, y: window.innerHeight - 200 }, window.innerWidth, window.innerHeight));
  const drag = useRef<{ pointer: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const previous = useRef<{ date: string; complete: boolean } | undefined>(undefined);
  const mainButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!goal) return;
    if (goalTransition(previous.current, goal)) setCelebrating(true);
    previous.current = { date: goal.date, complete: goal.complete };
  }, [goal]);

  useEffect(() => {
    if (!celebrating) return;
    const timer = setTimeout(() => setCelebrating(false), 4500);
    return () => clearTimeout(timer);
  }, [celebrating]);

  useEffect(() => {
    const resize = () => setPosition((value) => clampCompanion(value, window.innerWidth, window.innerHeight));
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && open) { setOpen(false); mainButton.current?.focus(); } };
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("keydown", escape); };
  }, [open]);

  const preference = (key: string, value: boolean) => {
    try { localStorage.setItem(`italiano:companion:${profileId}:${key}`, String(value)); } catch { /* State still works when storage is unavailable. */ }
  };
  const fold = () => { setFolded((value) => { preference("folded", !value); return !value; }); setOpen(false); mainButton.current?.focus(); };
  const close = () => { setOpen(false); mainButton.current?.focus(); };
  const percent = goal ? Math.round(goal.fraction * 100) : null;
  const pointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    setPosition(clampCompanion({ x: drag.current.startX + event.clientX - drag.current.x, y: drag.current.startY + event.clientY - drag.current.y }, window.innerWidth, window.innerHeight));
  };

  return createPortal(<aside className={`daily-companion ${folded ? "is-folded" : ""} ${goal?.complete ? "is-complete" : ""} ${celebrating ? "is-celebrating" : ""}`}
    data-effects={quiet ? "off" : "on"} style={{ left: position.x, top: position.y } as CSSProperties} aria-label="Супутник щоденного навчання">
    <div className="companion-body">
      {!folded && <div className="companion-tools"><button className="companion-grip" aria-label="Пересунути супутника: перетягни або натискай стрілки" title="Перетягни, щоб пересунути"
        onPointerDown={(event) => { if (event.button !== 0) return; drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          setPosition((value) => clampCompanion({ x: value.x + (event.key === "ArrowRight" ? 24 : event.key === "ArrowLeft" ? -24 : 0), y: value.y + (event.key === "ArrowDown" ? 24 : event.key === "ArrowUp" ? -24 : 0) }, window.innerWidth, window.innerHeight));
        }}><span aria-hidden="true">⠿</span></button><button onClick={fold} aria-label="Згорнути супутника" title="Згорнути">−</button></div>}
      <button ref={mainButton} className="companion-main" aria-label={`Денний еліксир: ${percent === null ? "дані недоступні" : `${percent}%`}. Показати деталі`} aria-expanded={open} aria-controls={id}
        onClick={() => { if (folded) { setFolded(false); preference("folded", false); } setOpen((value) => !value); }}>
        {folded ? <span className="companion-mini" aria-hidden="true">✦</span> : <ElixirVessel fraction={goal?.fraction ?? 0} active={Boolean(goal?.fraction)}/>}
        <span className="companion-caption"><b>{percent === null ? "—" : `${percent}%`}</b>{!folded && <small>{unavailable ? "Немає зв’язку" : goal?.complete ? "Ціль досягнуто ✓" : "Еліксир дня"}</small>}</span>
      </button>
      {celebrating && <div className="companion-sparks" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--spark-angle": `${index * 45}deg`, "--spark-delay": `${index * .06}s` } as CSSProperties}>✦</i>)}</div>}
    </div>
    <span className="companion-announcement" role="status">{celebrating ? "Денну ціль досягнуто! Сьогоднішній еліксир наповнено." : ""}</span>
    {open && <section id={id} className="companion-panel" aria-labelledby={`${id}-title`}>
      <header><div><span>IL TUO COMPAGNO</span><h2 id={`${id}-title`}>Еліксир сьогодні</h2></div><button aria-label="Закрити деталі супутника" onClick={close}>×</button></header>
      {goal ? <>
        <div className="companion-daily-result"><strong>{percent}%</strong><span>{goal.complete ? "Денну ціль досягнуто ✦" : "Кожна відповідь додає магії"}<small>{goal.date.split("-").reverse().join(".")}</small></span></div>
        <p>Обери будь-який шлях. Достатньо виконати одну умову:</p>
        <ul>{goal.criteria.map((criterion) => <li key={criterion.key}><span>{criterion.key === "seconds" ? "Хв у завершених сесіях" : criterion.label}</span><b>{criterion.key === "seconds" ? Math.floor(criterion.current / 60) : criterion.current} / {criterion.key === "seconds" ? criterion.target / 60 : criterion.target} {criterion.current >= criterion.target && <i aria-label="Виконано">✓</i>}</b><span className="companion-criterion-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, criterion.current / criterion.target * 100)}%` }}/></span></li>)}</ul>
        {goal.day_qualified && <p className="companion-streak-note">✓ Мінімум для серії днів виконано.{!goal.complete && " Еліксир наповнюється далі до денної цілі."}</p>}
        <p className="companion-reset">{goal.complete ? "Можеш навчатися далі — усі результати зберігаються. " : "Зараховуються збережені навчальні дії. "}Опівночі за Києвом почнеться новий еліксир. Попередні дні залишаться в історії.</p>
      </> : <div className="companion-unavailable"><p>{unavailable ? "Не вдалося перевірити сьогоднішню практику. Наповнення з’явиться після відновлення зв’язку." : "Завантажуємо сьогоднішню практику…"}</p>{unavailable && <button onClick={refresh}>Спробувати ще раз</button>}</div>}
      <div className="companion-panel-actions"><Link to="/progress" onClick={close}>Мій прогрес →</Link><button aria-pressed={quiet} onClick={() => { setQuiet((value) => { preference("quiet", !value); return !value; }); }}>{quiet ? "Оживити" : "Тихий режим"}</button></div>
      <small className="companion-drag-hint">Перетягни за ⠿ або згорни кнопкою −</small>
    </section>}
  </aside>, document.body);
}

export function DailyCompanion() {
  const { profileId } = useDailyPractice();
  return <Companion key={profileId} profileId={profileId}/>;
}
