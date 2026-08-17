import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function ReadingResultPage() {
  const { sessionId = "" } = useParams();
  const resultQuery = useQuery({
    queryKey: ["reading-result", sessionId],
    queryFn: () => api.readingResult(sessionId),
  });
  const [wordIndex, setWordIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const words = useMemo(() => Object.entries(resultQuery.data?.new_words ?? {}), [resultQuery.data]);

  if (!resultQuery.data) return <div className="state-page">Зберігаємо прогрес читання…</div>;
  const result = resultQuery.data;
  const current = words[wordIndex];
  const reviewed = Math.min(wordIndex, words.length);

  return (
    <div className="reading-result shell">
      <header>
        <span className="luxury-kicker"><i /> LETTURA COMPLETATA</span>
        <h1>Testo <em>completato.</em></h1>
        <p>{result.title_it} · {result.title_uk}</p>
      </header>

      <section className="reading-result-summary">
        <div className="reading-result-score"><strong>{result.accuracy}%</strong><span>{result.correct} з {result.total} відповідей</span></div>
        <div><small>НАЙКРАЩИЙ РЕЗУЛЬТАТ</small><b>{result.best_score}%</b></div>
        <div><small>ПРОЧИТАНО РАЗІВ</small><b>{result.completion_count}</b></div>
      </section>

      <section className="word-review">
        <header>
          <div><small>PAROLE NUOVE</small><h2>Повторіть нові слова</h2></div>
          <span>{Math.min(reviewed + (wordIndex >= words.length ? 0 : 1), words.length)} / {words.length}</span>
        </header>
        <div className="progress"><i style={{ width: `${words.length ? (reviewed / words.length) * 100 : 100}%` }} /></div>

        {current ? (
          <button className={`review-word-card ${revealed ? "revealed" : ""}`} onClick={() => setRevealed(true)}>
            <small>{revealed ? "ПЕРЕКЛАД" : "НАТИСНІТЬ, ЩОБ ПЕРЕВІРИТИ СЕБЕ"}</small>
            <strong>{current[0]}</strong>
            <span>{revealed ? current[1] : "••••••"}</span>
          </button>
        ) : (
          <div className="review-complete"><b>✓</b><strong>Нові слова повторено</strong><span>Вони залишаться у словнику цього тексту.</span></div>
        )}

        {current && <button className="review-next" disabled={!revealed} onClick={() => { setWordIndex((index) => index + 1); setRevealed(false); }}>Запам’ятав, далі <b>→</b></button>}
      </section>

      <footer className="reading-result-actions">
        <Link to="/reading">Обрати інший текст</Link>
        <Link className="launch-button" to="/reading"><span>Читати ще</span><b>→</b></Link>
      </footer>
    </div>
  );
}
