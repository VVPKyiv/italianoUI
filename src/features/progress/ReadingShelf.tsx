import { Link } from "react-router-dom";
import type { ProgressSnapshot } from "../../types";
import type { CSSProperties } from "react";

export function ReadingShelf({ reading }: { reading: ProgressSnapshot["reading"] }) {
  const visible = Math.min(10, reading.total_texts);
  return <section className="progress-section reading-shelf" aria-labelledby="shelf-title">
    <header><div><span className="observatory-eyebrow">LA BIBLIOTECA</span><h2 id="shelf-title">Твоя бібліотека</h2></div><Link to="/reading" aria-label="До текстів для читання">↗</Link></header>
    <div className="reading-shelf-count"><strong>{reading.completed_texts}<span> / {reading.total_texts}</span></strong><p>різних текстів прочитано</p></div>
    <div className="reading-books" aria-hidden="true">{Array.from({ length: visible }, (_, index) => <i key={index} className={index < reading.completed_texts ? "is-read" : ""} style={{ "--book-height": `${72 + (index * 13) % 30}px`, "--book-hue": `${140 + index * 7}` } as CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span></i>)}</div>
    <p className="reading-shelf-note">{reading.completed_texts > visible ? `І ще ${reading.completed_texts - visible} за межами цієї полиці.` : visible ? `Перші ${visible} прочитаних історій наповнюють цю полицю.` : "Тут з’являться твої прочитані історії."}</p>
    <dl><div><dt>Розуміння</dt><dd>{reading.questions_answered ? `${Math.round(reading.accuracy)}%` : "—"}</dd></div><div><dt>Нових слів відкрито</dt><dd>{reading.unique_words_opened}</dd></div><div><dt>Відповідей / прослуховувань</dt><dd>{reading.questions_answered} / {reading.audio_plays}</dd></div></dl>
    <Link className="reading-shelf-link" to="/reading">Відкрити наступну історію <span>→</span></Link>
  </section>;
}
