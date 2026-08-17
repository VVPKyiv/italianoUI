import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

export function ListeningResultPage() {
  const { sessionId = "" } = useParams();
  const result = useQuery({
    queryKey: ["listening-result", sessionId],
    queryFn: () => api.listeningResult(sessionId),
  });
  if (!result.data) return <div className="state-page">Рахуємо результат…</div>;

  return (
    <div className="listening-result shell">
      <span className="luxury-kicker"><i /> ASCOLTO COMPLETATO</span>
      <h1>Сесію <em>прослухано.</em></h1>
      <div className="sentence-result-score"><strong>{result.data.accuracy}%</strong><span>{result.data.correct} з {result.data.total} правильно</span></div>
      {result.data.mistakes.length > 0 && (
        <section className="listening-mistakes">
          <small>ПОВТОРИТИ</small>
          <h2>Слова, які варто прослухати ще раз</h2>
          {result.data.mistakes.map((mistake) => (
            <article key={`${mistake.italian_text}-${mistake.selected_answer}`}>
              <b>{mistake.italian_text}</b><span>{mistake.ukrainian_text}</span><small>Ваша відповідь: {mistake.selected_answer}</small>
            </article>
          ))}
        </section>
      )}
      <Link className="launch-button" to="/training/setup/listening"><span>Нове аудіювання</span><b>→</b></Link>
    </div>
  );
}
