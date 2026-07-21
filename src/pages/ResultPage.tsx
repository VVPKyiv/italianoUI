import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function ResultPage() {
  const { sessionId = "" } = useParams();
  const query = useQuery({ queryKey: ["result", sessionId], queryFn: () => api.result(sessionId) });
  if (query.isLoading) return <div className="state-page">Рахуємо результат…</div>;
  if (!query.data) return <div className="state-page"><h1>Результат недоступний</h1><Link className="primary" to="/">На головну</Link></div>;
  const result = query.data;
  return <div className="result shell"><section className="result-hero"><div className="score-ring" style={{ "--score": `${result.accuracy}%` } as React.CSSProperties}><strong>{result.accuracy}%</strong><small>точність</small></div><div><span className="eyebrow">ТРЕНУВАННЯ ЗАВЕРШЕНО</span><h1>{result.accuracy >= 80 ? "Ottimo lavoro!" : "Добрий початок."}</h1><p>Це результат саме цієї сесії — без вигаданого досвіду чи серій.</p></div></section><div className="result-stats"><article><span>✓</span><strong>{result.correct}</strong><small>правильно</small></article><article><span>×</span><strong>{result.incorrect}</strong><small>потребують повторення</small></article><article><span>Σ</span><strong>{result.total}</strong><small>усього слів</small></article></div>{result.mistakes.length > 0 && <section className="mistakes"><div><span className="eyebrow">ДЛЯ ПОВТОРЕННЯ</span><h2>Слова, які були складними</h2></div>{result.mistakes.map((word) => <article key={`${word.ukrainian}-${word.italian}`}><span>{word.ukrainian}</span><b>{word.italian}</b></article>)}</section>}<div className="result-actions"><Link className="primary" to="/">Нове тренування <span>→</span></Link></div></div>;
}
